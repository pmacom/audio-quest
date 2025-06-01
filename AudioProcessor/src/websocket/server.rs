use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex as TokioMutex;
use tokio::sync::mpsc;
use futures_util::StreamExt;
use tungstenite::Message;
use tokio::time;
use std::time::Duration;

pub async fn handle_connection(
    stream: TcpStream,
    clients: Arc<TokioMutex<Vec<futures_util::stream::SplitSink<tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>, Message>>>>,
    client_count_tx: mpsc::Sender<usize>,
) {
    let ws_stream = tokio_tungstenite::accept_async(stream).await.expect("WebSocket handshake failed");
    let (write, mut read) = ws_stream.split();
    
    // Add client and notify TUI
    {
        let mut clients_guard = clients.lock().await;
        clients_guard.push(write);
        let _ = client_count_tx.send(clients_guard.len()).await;
    }
    
    // Wait for client to disconnect by reading messages (and ignoring them)
    while let Some(msg) = read.next().await {
        if msg.is_err() {
            break; // Client disconnected
        }
    }
    
    // Client disconnected, notify TUI of new count
    {
        let clients_guard = clients.lock().await;
        let _ = client_count_tx.send(clients_guard.len()).await;
    }
} 