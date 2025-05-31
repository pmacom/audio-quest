fn main() {
    prost_build::compile_protos(&["src/state.proto"], &["src"]).unwrap();
} 