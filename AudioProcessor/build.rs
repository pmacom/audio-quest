use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let proto_file = "src/state.proto";
    let generated_file = format!("{}/_.rs", out_dir);
    println!("[build.rs] OUT_DIR: {}", out_dir);
    println!("[build.rs] Compiling proto: {}", proto_file);

    // Compile proto with prost-build
    match prost_build::compile_protos(&[proto_file], &["src"]) {
        Ok(_) => println!("[build.rs] Protobuf compilation succeeded."),
        Err(e) => panic!("[build.rs] Protobuf compilation failed: {}", e),
    }

    // Move the generated file to _.rs
    let generated_state = format!("{}/audio_processor.rs", out_dir);
    println!("[build.rs] Looking for generated file: {}", generated_state);
    if Path::new(&generated_state).exists() {
        match fs::rename(&generated_state, &generated_file) {
            Ok(_) => println!("[build.rs] Renamed audio_processor.rs to _.rs successfully."),
            Err(e) => panic!("[build.rs] Failed to rename audio_processor.rs to _.rs: {}", e),
        }
    } else {
        panic!("[build.rs] Expected generated file not found: {}", generated_state);
    }
} 