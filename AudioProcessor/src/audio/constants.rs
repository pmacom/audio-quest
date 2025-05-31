// Audio constants and configuration structs

pub struct Constants {
    pub frequency_data_buffer_size: usize,
    pub sample_rate: f32,
    pub decay_rate: f32,
    pub target_ranges: TargetRanges,
    pub gain_adjust_rate: f32,
    pub audio_activity_threshold: f32,
    pub noise_floor: f32,
    pub vocal_harmonic_weight: f32,
    pub vocal_mid_weight: f32,
    pub vocal_variance_weight: f32,
    pub vocal_freq_min: f32,
    pub vocal_freq_max: f32,
    pub harmonic_threshold: f32,
    pub harmonic_count: usize,
    pub vocal_max_variance: f32,
    pub history_window_size: HistoryWindowSize,
    pub beat_detection_parameters: BeatDetectionParameters,
    pub websocket_update_interval_ms: u64,
}

pub struct HistoryWindowSize {
    pub freq_history_window: usize,
    pub beat_history_window: usize,
    pub vocal_history_window: usize,
    pub vocal_variance_window: usize,
    pub beat_time_window: f32,
}

pub struct TargetRanges {
    pub min: f32,
    pub max: f32,
}

pub struct BeatDetectionParameters {
    pub beat_alpha: f32,
    pub beat_threshold: f32,
    pub min_beat_interval: f32,
    pub beat_decay_rate: f32,
    pub bps_smoothing_factor: f32,
    pub spectral_flux_threshold: f32,
    pub kick_freq_range: FreqRange,
    pub snare_freq_range: FreqRange,
    pub hihat_freq_range: FreqRange,
    pub energy_scale: f32,
    pub hihat_energy_scale: f32,
    pub db_min: f32,
    pub db_max: f32,
    pub min_kick_energy: f32,
    pub min_beat_intensity: f32,
}

pub struct FreqRange {
    pub min: f32,
    pub max: f32,
}

pub const CONSTANTS: Constants = Constants {
    frequency_data_buffer_size: 1024,
    sample_rate: 44100.0,
    decay_rate: 0.8,
    target_ranges: TargetRanges { min: 0.1, max: 0.9 },
    gain_adjust_rate: 0.01,
    audio_activity_threshold: 0.01,
    noise_floor: 1e-8,
    vocal_harmonic_weight: 0.4,
    vocal_mid_weight: 0.4,
    vocal_variance_weight: 0.2,
    vocal_freq_min: 200.0,
    vocal_freq_max: 6000.0,
    harmonic_threshold: 0.1,
    harmonic_count: 5,
    vocal_max_variance: 0.1,
    history_window_size: HistoryWindowSize {
        freq_history_window: 12,
        beat_history_window: 12,
        vocal_history_window: 12,
        vocal_variance_window: 5,
        beat_time_window: 1.0,
    },
    beat_detection_parameters: BeatDetectionParameters {
        beat_alpha: 0.8,
        beat_threshold: 1.2,
        min_beat_interval: 0.2,
        beat_decay_rate: 0.5,
        bps_smoothing_factor: 0.2,
        spectral_flux_threshold: 0.01,
        kick_freq_range: FreqRange { min: 40.0, max: 100.0 },
        snare_freq_range: FreqRange { min: 120.0, max: 500.0 },
        hihat_freq_range: FreqRange { min: 2000.0, max: 10000.0 },
        energy_scale: 8.0,
        hihat_energy_scale: 15.0,
        db_min: -100.0,
        db_max: 0.0,
        min_kick_energy: 0.00001,
        min_beat_intensity: 0.01,
    },
    websocket_update_interval_ms: 10,
}; 