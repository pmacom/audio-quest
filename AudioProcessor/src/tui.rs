use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::Span,
    widgets::{Block, Borders, List, ListItem, Paragraph},
    Frame, Terminal,
};
use std::io;
use tokio::sync::mpsc;
use crate::audio::processor::ProtoState;
use std::time::{Duration, Instant};

pub struct TuiApp {
    pub latest_state: Option<ProtoState>,
    pub connected_clients: usize,
    pub start_time: Instant,
    pub frame_count: u64,
}

impl TuiApp {
    pub fn new() -> Self {
        Self {
            latest_state: None,
            connected_clients: 0,
            start_time: Instant::now(),
            frame_count: 0,
        }
    }

    pub fn update_state(&mut self, state: ProtoState) {
        self.latest_state = Some(state);
        self.frame_count += 1;
    }

    pub fn update_clients(&mut self, count: usize) {
        self.connected_clients = count;
    }
}

pub async fn run_tui(mut rx: mpsc::Receiver<ProtoState>, mut client_count_rx: mpsc::Receiver<usize>) -> Result<(), Box<dyn std::error::Error>> {
    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app = TuiApp::new();
    let mut last_tick = Instant::now();
    let tick_rate = Duration::from_millis(16); // ~60 FPS

    loop {
        // Handle incoming state updates
        while let Ok(state) = rx.try_recv() {
            app.update_state(state);
        }
        
        // Handle client count updates
        while let Ok(count) = client_count_rx.try_recv() {
            app.update_clients(count);
        }

        // Draw the UI
        terminal.draw(|f| ui(f, &app))?;

        // Handle input events
        let timeout = tick_rate
            .checked_sub(last_tick.elapsed())
            .unwrap_or_else(|| Duration::from_secs(0));

        if crossterm::event::poll(timeout)? {
            if let Event::Key(key) = event::read()? {
                match key.code {
                    KeyCode::Char('q') | KeyCode::Esc => break,
                    _ => {}
                }
            }
        }

        if last_tick.elapsed() >= tick_rate {
            last_tick = Instant::now();
        }
    }

    // Restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    Ok(())
}

fn ui(f: &mut Frame, app: &TuiApp) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .margin(1)
        .constraints([
            Constraint::Length(3), // Header
            Constraint::Min(10),   // Main content
            Constraint::Length(3), // Footer
        ])
        .split(f.size());

    // Header
    let header = Paragraph::new(format!(
        "AudioProcessor Live Monitor | Uptime: {:.1}s | Frames: {} | Clients: {}",
        app.start_time.elapsed().as_secs_f32(),
        app.frame_count,
        app.connected_clients
    ))
    .block(Block::default().borders(Borders::ALL).title("Status"))
    .style(Style::default().fg(Color::Green));
    f.render_widget(header, chunks[0]);

    // Main content
    if let Some(ref state) = app.latest_state {
        render_audio_data(f, chunks[1], state);
    } else {
        let waiting = Paragraph::new("Waiting for audio data...")
            .block(Block::default().borders(Borders::ALL).title("Audio Data"))
            .style(Style::default().fg(Color::Yellow));
        f.render_widget(waiting, chunks[1]);
    }

    // Footer
    let footer = Paragraph::new("Press 'q' or ESC to quit")
        .block(Block::default().borders(Borders::ALL))
        .style(Style::default().fg(Color::Gray));
    f.render_widget(footer, chunks[2]);
}

fn render_audio_data(f: &mut Frame, area: Rect, state: &ProtoState) {
    let chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(33), Constraint::Percentage(33), Constraint::Percentage(34)])
        .split(area);

    // Left side: Frequency and amplitude data
    render_frequency_data(f, chunks[0], state);
    
    // Middle: Beat detection and analysis
    render_analysis_data(f, chunks[1], state);
    
    // Right side: Grid visualization
    render_grid_data(f, chunks[2], state);
}

fn render_frequency_data(f: &mut Frame, area: Rect, state: &ProtoState) {
    let items = vec![
        ListItem::new(format!("Time: {:.3}s", state.time)),
        ListItem::new(format!("Adjusted Time: {:.3}s", state.adjusted_time)),
        ListItem::new(""),
        ListItem::new(Span::styled("FREQUENCY BANDS", Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD))),
        ListItem::new(format!("Low:  {:.3} (dyn: {:.3})", state.low, state.low_dynamic)),
        ListItem::new(format!("Mid:  {:.3} (dyn: {:.3})", state.mid, state.mid_dynamic)),
        ListItem::new(format!("High: {:.3} (dyn: {:.3})", state.high, state.high_dynamic)),
        ListItem::new(""),
        ListItem::new(Span::styled("AMPLITUDE", Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD))),
        ListItem::new(format!("Amplitude: {:.3} (dyn: {:.3})", state.amplitude, state.amplitude_dynamic)),
        ListItem::new(format!("Raw Amplitude: {:.3} (dyn: {:.3})", state.raw_amplitude, state.raw_amplitude_dynamic)),
        ListItem::new(""),
        ListItem::new(Span::styled("WAVEFORM", Style::default().fg(Color::Green).add_modifier(Modifier::BOLD))),
        ListItem::new(format!("Sin: {:.3} (norm: {:.3})", state.sin, state.sin_normal)),
        ListItem::new(format!("Cos: {:.3} (norm: {:.3})", state.cos, state.cos_normal)),
        ListItem::new(format!("Adj Sin: {:.3} (norm: {:.3})", state.adjusted_sin, state.adjusted_sin_normal)),
        ListItem::new(format!("Adj Cos: {:.3} (norm: {:.3})", state.adjusted_cos, state.adjusted_cos_normal)),
    ];

    let list = List::new(items)
        .block(Block::default().borders(Borders::ALL).title("Frequency & Amplitude"))
        .style(Style::default().fg(Color::White));
    f.render_widget(list, area);
}

fn render_analysis_data(f: &mut Frame, area: Rect, state: &ProtoState) {
    // Calculate frequency grid map average
    let grid_map_avg = if state.frequency_grid_map.is_empty() {
        0.0
    } else {
        state.frequency_grid_map.iter().sum::<f64>() / state.frequency_grid_map.len() as f64
    };

    let items = vec![
        ListItem::new(Span::styled("BEAT DETECTION", Style::default().fg(Color::Red).add_modifier(Modifier::BOLD))),
        ListItem::new(format!("Kick:  {:.3} (dyn: {:.3})", state.kick, state.kick_dynamic)),
        ListItem::new(format!("Snare: {:.3} (dyn: {:.3})", state.snare, state.snare_dynamic)),
        ListItem::new(format!("HiHat: {:.3} (dyn: {:.3})", state.hihat, state.hihat_dynamic)),
        ListItem::new(""),
        ListItem::new(Span::styled("RHYTHM ANALYSIS", Style::default().fg(Color::Magenta).add_modifier(Modifier::BOLD))),
        ListItem::new(format!("Beat Intensity: {:.3}", state.beat_intensity)),
        ListItem::new(format!("BPS: {:.2}", state.bps)),
        ListItem::new(format!("Beat Phase: {:.3}", state.beat_phase)),
        ListItem::new(format!("Last Beat: {:.3}s ago", state.time - state.last_beat_time)),
        ListItem::new(""),
        ListItem::new(Span::styled("SPECTRAL ANALYSIS", Style::default().fg(Color::Blue).add_modifier(Modifier::BOLD))),
        ListItem::new(format!("Spectral Flux: {:.3}", state.spectral_flux)),
        ListItem::new(format!("Spectral Centroid: {:.1} Hz", state.spectral_centroid)),
        ListItem::new(format!("Vocal Likelihood: {:.3}", state.vocal_likelihood)),
        ListItem::new(format!("Freq Grid Avg: {:.3}", grid_map_avg)),
        ListItem::new(""),
        ListItem::new(Span::styled("QUANTIZED BANDS", Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD))),
        ListItem::new(format!("Bands: {} values", state.quantized_bands.len())),
        ListItem::new(format!("Chromagram: {} bins", state.chromagram.len())),
        ListItem::new(format!("Beat Times: {} recorded", state.beat_times.len())),
    ];

    let list = List::new(items)
        .block(Block::default().borders(Borders::ALL).title("Analysis & Detection"))
        .style(Style::default().fg(Color::White));
    f.render_widget(list, area);
}

fn render_grid_data(f: &mut Frame, area: Rect, state: &ProtoState) {
    let grid = &state.frequency_grid_map;
    
    if grid.is_empty() {
        let empty = List::new(vec![ListItem::new("No grid data available")])
            .block(Block::default().borders(Borders::ALL).title("Frequency Grid (16x16)"))
            .style(Style::default().fg(Color::Gray));
        f.render_widget(empty, area);
        return;
    }

    // Calculate grid statistics
    let min_val = grid.iter().cloned().fold(f64::INFINITY, f64::min);
    let max_val = grid.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let avg_val = grid.iter().sum::<f64>() / grid.len() as f64;
    let variance = grid.iter().map(|&x| (x - avg_val).powi(2)).sum::<f64>() / grid.len() as f64;
    let std_dev = variance.sqrt();

    // Sample values from different grid positions (16x16 = 256 total)
    let corners = [
        (0, "Top-Left"),
        (15, "Top-Right"), 
        (240, "Bottom-Left"),
        (255, "Bottom-Right")
    ];
    
    let center_points = [
        (119, "Center-Left"),  // Row 7, Col 7
        (120, "Center"),       // Row 7, Col 8  
        (135, "Center-Right"), // Row 8, Col 7
        (136, "Center-Bottom") // Row 8, Col 8
    ];

    // Create visual bars for some grid values (using simple text bars)
    let make_bar = |value: f64, max: f64| -> String {
        let normalized = if max > 0.0 { (value / max * 20.0) as usize } else { 0 };
        let bar = "█".repeat(normalized.min(20));
        let spaces = " ".repeat(20 - normalized.min(20));
        format!("{}{} {:.3}", bar, spaces, value)
    };

    let mut items = vec![
        ListItem::new(Span::styled("GRID STATISTICS", Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD))),
        ListItem::new(format!("Min:     {:.4}", min_val)),
        ListItem::new(format!("Max:     {:.4}", max_val)),
        ListItem::new(format!("Average: {:.4}", avg_val)),
        ListItem::new(format!("Std Dev: {:.4}", std_dev)),
        ListItem::new(""),
        ListItem::new(Span::styled("CORNER VALUES", Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD))),
    ];

    // Add corner values
    for &(idx, label) in &corners {
        if idx < grid.len() {
            items.push(ListItem::new(format!("{}: {:.3}", label, grid[idx])));
        }
    }

    items.push(ListItem::new(""));
    items.push(ListItem::new(Span::styled("CENTER VALUES", Style::default().fg(Color::Green).add_modifier(Modifier::BOLD))));

    // Add center values  
    for &(idx, label) in &center_points {
        if idx < grid.len() {
            items.push(ListItem::new(format!("{}: {:.3}", label, grid[idx])));
        }
    }

    items.push(ListItem::new(""));
    items.push(ListItem::new(Span::styled("ACTIVITY BARS", Style::default().fg(Color::Magenta).add_modifier(Modifier::BOLD))));
    
    // Show bars for some key positions
    let key_positions = [(0, "TL"), (15, "TR"), (120, "Center"), (255, "BR")];
    for &(idx, label) in &key_positions {
        if idx < grid.len() {
            items.push(ListItem::new(format!("{}: {}", label, make_bar(grid[idx], max_val))));
        }
    }

    let list = List::new(items)
        .block(Block::default().borders(Borders::ALL).title("Frequency Grid (16x16)"))
        .style(Style::default().fg(Color::White));
    f.render_widget(list, area);
} 