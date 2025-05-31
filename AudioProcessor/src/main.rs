#[allow(dead_code)]
mod force_build_rs {
    include!(concat!(env!("OUT_DIR"), "/_.rs"));
}
mod audio {
    pub mod constants;
    pub mod processor;
}
mod websocket {
    pub mod server;
}
mod state;

use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as TokioMutex;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tokio::net::TcpListener;
use tungstenite::Message;
use tokio::sync::mpsc;
use std::time::{SystemTime, UNIX_EPOCH};
use futures_util::SinkExt;
use crate::audio::processor::{AudioProcessor, ProtoState};
use std::io::{self, Write};
use rustfft::{FftPlanner, num_complex::Complex, num_traits::Zero};
use std::sync::atomic::{AtomicU64, Ordering};
use prost::Message as ProstMessage;

fn select_input_device() -> cpal::Device {
    let host = cpal::default_host();
    let devices = host.input_devices().expect("Failed to get input devices");
    let devices: Vec<_> = devices.collect();
    if devices.is_empty() {
        panic!("No input devices available");
    }
    println!("Available input devices:");
    for (i, device) in devices.iter().enumerate() {
        println!("  [{}] {}", i, device.name().unwrap_or_else(|_| "Unknown".to_string()));
    }
    print!("Select input device by number: ");
    io::stdout().flush().unwrap();
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let index: usize = input.trim().parse().expect("Invalid input");
    if index >= devices.len() {
        panic!("Invalid device index");
    }
    devices[index].clone()
}

fn select_update_rate() -> f64 {
    println!("\nSelect WebSocket update rate:");
    println!("  [0] 60Hz   - Ultra-smooth, best for high-fidelity real-time visuals (higher CPU/network)");
    println!("  [1] 30Hz   - Good for most real-time visualizations, smoother than video frame rate");
    println!("  [2] 20Hz   - Balanced for responsive visuals with lower resource use");
    println!("  [3] 10Hz   - Low update rate, best for simple or less dynamic displays");
    println!("  [4] 100Hz  - Ultra-high refresh, for pro visuals and fast hardware");
    println!("  [5] 120Hz  - Matches high-refresh-rate monitors (120Hz)");
    println!("  [6] As fast as possible - No throttle, maximum update rate (may use a lot of CPU/network!)");
    print!("Choose update rate by number: ");
    io::stdout().flush().unwrap();
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let index: usize = input.trim().parse().expect("Invalid input");
    match index {
        0 => 1.0 / 60.0,
        1 => 1.0 / 30.0,
        2 => 1.0 / 20.0,
        3 => 1.0 / 10.0,
        4 => 1.0 / 100.0,
        5 => 1.0 / 120.0,
        6 => 0.0, // Special value for no throttle
        _ => {
            println!("Invalid selection, defaulting to 30Hz.");
            1.0 / 30.0
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // WebSocket server configuration
    let addr = "127.0.0.1:8765";
    let listener = TcpListener::bind(addr).await?;
    println!("WebSocket server running on ws://{}", addr);

    // Shared state for connected clients
    let clients = Arc::new(TokioMutex::new(Vec::<futures_util::stream::SplitSink<tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>, Message>>::new()));

    // Channel for sending messages from audio thread to async task
    let (tx, mut rx) = mpsc::channel::<Vec<u8>>(100);

    // Spawn async task to handle WebSocket sending
    let clients_clone = Arc::clone(&clients);
    tokio::spawn(async move {
        while let Some(message) = rx.recv().await {
            let mut clients = clients_clone.lock().await;
            let mut new_clients = Vec::new();
            for mut client in clients.drain(..) {
                // Send as binary frame
                if client.send(Message::Binary(message.clone())).await.is_ok() {
                    new_clients.push(client);
                }
            }
            *clients = new_clients;
        }
    });

    // Audio configuration
    let device = select_input_device();
    let update_period = select_update_rate();
    let config = device.default_input_config().expect("No input config available");

    // Audio processor
    let processor: Arc<Mutex<AudioProcessor>> = Arc::new(Mutex::new(AudioProcessor::new()));
    let processor_clone: Arc<Mutex<AudioProcessor>> = Arc::clone(&processor);
    let tx_clone = tx.clone();
    // Throttle: shared last update time (as f64 seconds since epoch, in microseconds for atomicity)
    let last_update_time = Arc::new(AtomicU64::new(0));
    let last_update_time_clone = Arc::clone(&last_update_time);

    // FFT setup
    let fft_size = 1024;
    let mut planner = FftPlanner::<f32>::new();
    let fft = planner.plan_fft_forward(fft_size);
    let mut fft_input = vec![Complex::zero(); fft_size];
    let mut fft_output = vec![Complex::zero(); fft_size];

    // Audio stream setup
    let stream = device.build_input_stream(
        &config.into(),
        move |data: &[f32], _: &cpal::InputCallbackInfo| {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs_f64();
            let delta_time = 1.0 / 60.0; // Approximate frame time

            // Throttle logic
            if update_period > 0.0 {
                let now_us = (now * 1_000_000.0) as u64;
                let last_us = last_update_time_clone.load(Ordering::Relaxed);
                let period_us = (update_period * 1_000_000.0) as u64;
                if now_us < last_us + period_us {
                    return;
                }
                last_update_time_clone.store(now_us, Ordering::Relaxed);
            }

            // Copy or zero-pad data into fft_input
            for (i, sample) in fft_input.iter_mut().enumerate() {
                *sample = if i < data.len() {
                    Complex::new(data[i], 0.0)
                } else {
                    Complex::zero()
                };
            }
            // Run FFT
            fft_output.copy_from_slice(&fft_input);
            fft.process(&mut fft_output);
            // Compute magnitude spectrum (only first N/2 bins are real for real input)
            let magnitudes: Vec<f32> = fft_output.iter().take(fft_size / 2).map(|c| c.norm()).collect();
            let mut processor = processor_clone.lock().unwrap();
            if let Some(state) = processor.update_base_state(delta_time, &magnitudes, now) {
                let proto_state = ProtoState::from(&state);
                let mut buf = Vec::new();
                ProstMessage::encode(&proto_state, &mut buf).unwrap();
                let _ = tx_clone.blocking_send(buf);
            }
        },
        |err| eprintln!("Audio stream error: {}", err),
        None,
    )?;

    // Start audio stream
    stream.play()?;

    // WebSocket server loop
    while let Ok((stream, _)) = listener.accept().await {
        let clients_clone = Arc::clone(&clients);
        tokio::spawn(websocket::server::handle_connection(stream, clients_clone));
    }

    Ok(())
}