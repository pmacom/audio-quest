use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex as TokioMutex;
use futures_util::StreamExt;
use tungstenite::Message;
use tokio::time;
use std::time::Duration;

pub async fn handle_connection(
    stream: TcpStream,
    clients: Arc<TokioMutex<Vec<futures_util::stream::SplitSink<tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>, Message>>>>,
) {
    let ws_stream = tokio_tungstenite::accept_async(stream).await.expect("WebSocket handshake failed");
    let (write, _) = ws_stream.split();
    clients.lock().await.push(write);
    time::sleep(Duration::from_secs(u64::MAX)).await;
} 