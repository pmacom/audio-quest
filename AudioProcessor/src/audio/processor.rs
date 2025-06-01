use crate::state::PrimaryFreq530State;
use prost::Message;
use image::{ImageBuffer, Rgb};
use std::io::Cursor;

// Define GRID_MAP_SIZE, e.g., for a 16x16 grid representation
const GRID_MAP_SIZE: usize = 256;

pub struct GainState {
    pub value: f32,
    pub gain: f32,
}

pub struct CircularBuffer {
    buffer: Vec<f32>,
    index: usize,
    capacity: usize,
}

impl CircularBuffer {
    pub fn new(capacity: usize) -> Self {
        CircularBuffer {
            buffer: vec![0.0; capacity],
            index: 0,
            capacity,
        }
    }

    pub fn push(&mut self, value: f32) {
        self.buffer[self.index] = value;
        self.index = (self.index + 1) % self.capacity;
    }

    pub fn values(&self) -> &[f32] {
        &self.buffer
    }
}

pub struct HistoryState {
    pub buffer: CircularBuffer,
    pub min: f32,
    pub max: f32,
}

impl HistoryState {
    pub fn new(size: usize) -> Self {
        HistoryState {
            buffer: CircularBuffer::new(size),
            min: f32::INFINITY,
            max: f32::NEG_INFINITY,
        }
    }

    pub fn update_min_max(&mut self, new_value: f32) {
        if new_value > self.max {
            self.max = new_value;
        }
        if new_value < self.min {
            self.min = new_value;
        }
        let old_value = self.buffer.values()[0];
        if old_value == self.min || old_value == self.max {
            let values = self.buffer.values();
            self.min = values.iter().copied().fold(f32::INFINITY, f32::min).min(new_value);
            self.max = values.iter().copied().fold(f32::NEG_INFINITY, f32::max).max(new_value);
        }
    }
}

pub struct AudioProcessor {
    pub low_history: HistoryState,
    pub mid_history: HistoryState,
    pub high_history: HistoryState,
    pub kick_history: HistoryState,
    pub snare_history: HistoryState,
    pub hihat_history: HistoryState,
    pub vocal_history: HistoryState,
    pub amplitude_history: HistoryState,
    pub raw_amplitude_history: HistoryState,
    pub prev_low: f32,
    pub prev_mid: f32,
    pub prev_high: f32,
    pub prev_kick: f32,
    pub prev_snare: f32,
    pub prev_hihat: f32,
    pub prev_amplitude: f32,
    pub prev_raw_amplitude: f32,
    pub snare_average: f32,
    pub hihat_average: f32,
    pub prev_fft_bins: Option<Vec<f32>>,
    pub spectral_flux: f32,
    pub last_beat_time: f64,
    pub beat_times: Vec<f64>,
    pub time: f64,
    pub adjusted_time: f64,
    pub beat_intensity: f32,
    pub bps: f32,
    pub kick_average: f32,
    pub kick_gain: f32,
    pub snare_gain: f32,
    pub hihat_gain: f32,
    pub vocal_gain: f32,
    pub amplitude_gain: f32,
    pub raw_amplitude_gain: f32,
    pub low_gain: f32,
    pub mid_gain: f32,
    pub high_gain: f32,
    pub last_update: f64,
    pub pending_state: Option<PrimaryFreq530State>,
    pub max_low: f32,
    pub max_mid: f32,
    pub max_high: f32,
    pub max_kick: f32,
    pub max_snare: f32,
    pub max_hihat: f32,
    pub max_amplitude: f32,
    pub max_raw_amplitude: f32,
    pub low_dynamic_smoothed: f32,
    pub mid_dynamic_smoothed: f32,
    pub high_dynamic_smoothed: f32,
    pub kick_dynamic_smoothed: f32,
    pub snare_dynamic_smoothed: f32,
    pub hihat_dynamic_smoothed: f32,
    pub amplitude_dynamic_smoothed: f32,
    pub raw_amplitude_dynamic_smoothed: f32,
    pub fade_in_out: f32,
    pub quantized_bands: Vec<u8>,
    pub rolling_max_bands: f32,
}

pub struct BeatDetectionState {
    pub kick_average: f32,
    pub snare_average: f32,
    pub hihat_average: f32,
    pub is_beat_candidate: bool,
    pub combined_ratio: f32,
    pub time_since_last_beat: f64,
}

// --- BEGIN IMPL FROM OLD MAIN.RS ---

use crate::audio::constants::CONSTANTS;

impl AudioProcessor {
    pub fn new() -> Self {
        AudioProcessor {
            low_history: HistoryState::new(CONSTANTS.history_window_size.freq_history_window * 2),
            mid_history: HistoryState::new(CONSTANTS.history_window_size.freq_history_window * 2),
            high_history: HistoryState::new(CONSTANTS.history_window_size.freq_history_window * 2),
            kick_history: HistoryState::new(CONSTANTS.history_window_size.beat_history_window),
            snare_history: HistoryState::new(CONSTANTS.history_window_size.beat_history_window),
            hihat_history: HistoryState::new(CONSTANTS.history_window_size.beat_history_window),
            vocal_history: HistoryState::new(CONSTANTS.history_window_size.vocal_history_window),
            amplitude_history: HistoryState::new(CONSTANTS.history_window_size.freq_history_window),
            raw_amplitude_history: HistoryState::new(CONSTANTS.history_window_size.freq_history_window),
            prev_low: 0.0,
            prev_mid: 0.0,
            prev_high: 0.0,
            prev_kick: 0.0,
            prev_snare: 0.0,
            prev_hihat: 0.0,
            prev_amplitude: 0.0,
            prev_raw_amplitude: 0.0,
            snare_average: 0.0,
            hihat_average: 0.0,
            prev_fft_bins: None,
            spectral_flux: 0.0,
            last_beat_time: f64::NEG_INFINITY,
            beat_times: Vec::new(),
            time: 0.0,
            adjusted_time: 0.0,
            beat_intensity: 0.0,
            bps: 0.0,
            kick_average: 0.0,
            kick_gain: 1.0,
            snare_gain: 1.0,
            hihat_gain: 1.0,
            vocal_gain: 1.0,
            amplitude_gain: 1.0,
            raw_amplitude_gain: 1.0,
            low_gain: 1.0,
            mid_gain: 1.0,
            high_gain: 1.0,
            last_update: 0.0,
            pending_state: None,
            max_low: 1.0,
            max_mid: 1.0,
            max_high: 1.0,
            max_kick: 1.0,
            max_snare: 1.0,
            max_hihat: 1.0,
            max_amplitude: 1.0,
            max_raw_amplitude: 1.0,
            low_dynamic_smoothed: 0.5,
            mid_dynamic_smoothed: 0.5,
            high_dynamic_smoothed: 0.5,
            kick_dynamic_smoothed: 0.5,
            snare_dynamic_smoothed: 0.5,
            hihat_dynamic_smoothed: 0.5,
            amplitude_dynamic_smoothed: 0.5,
            raw_amplitude_dynamic_smoothed: 0.5,
            fade_in_out: 0.0,
            quantized_bands: vec![0; 32],
            rolling_max_bands: 1.0,
        }
    }

    pub fn update_base_state(&mut self, delta_time: f32, frequency_data: &[f32], now: f64) -> Option<PrimaryFreq530State> {
        // Update time-related states
        self.time += delta_time as f64;
        self.adjusted_time += delta_time as f64 * self.prev_amplitude as f64;
        let new_sin = self.time.sin();
        let new_cos = self.time.cos();
        let new_sin_normal = (new_sin + 1.0) / 2.0;
        let new_cos_normal = (new_cos + 1.0) / 2.0;
        let new_adjusted_sin = self.adjusted_time.sin();
        let new_adjusted_cos = self.adjusted_time.cos();
        let new_adjusted_sin_normal = (new_adjusted_sin + 1.0) / 2.0;
        let new_adjusted_cos_normal = (new_adjusted_cos + 1.0) / 2.0;

        let sanitized_last_beat_time = if self.last_beat_time.is_finite() && self.last_beat_time > 0.0 {
            self.last_beat_time
        } else {
            0.0
        };
        // --- BEGIN SPECTROGRAM PNG GENERATION ---
        let width = 64;
        let height = frequency_data.len().min(64); // Use up to 64 bins for height
        let mut buffer = vec![0u8; width * height * 3];
        // Normalize FFT data for this frame
        let min_val = frequency_data.iter().cloned().fold(f32::INFINITY, f32::min);
        let max_val = frequency_data.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
        let norm = (max_val - min_val).max(1e-6);
        for x in 0..width {
            for y in 0..height {
                let idx = y * width + x;
                let bin = y;
                let v = ((frequency_data[bin] - min_val) / norm * 255.0).clamp(0.0, 255.0) as u8;
                buffer[idx * 3 + 0] = v;
                buffer[idx * 3 + 1] = v;
                buffer[idx * 3 + 2] = v;
            }
        }
        let img = ImageBuffer::<Rgb<u8>, _>::from_raw(width as u32, height as u32, buffer).unwrap();
        let mut png_bytes: Vec<u8> = Vec::new();
        img.write_to(&mut Cursor::new(&mut png_bytes), image::ImageFormat::Png).unwrap();
        // --- END SPECTROGRAM PNG GENERATION ---
        let state = if frequency_data.is_empty() {
            PrimaryFreq530State {
                time: self.time,
                adjusted_time: self.adjusted_time,
                sin: new_sin,
                cos: new_cos,
                sin_normal: new_sin_normal,
                cos_normal: new_cos_normal,
                adjusted_sin: new_adjusted_sin,
                adjusted_cos: new_adjusted_cos,
                adjusted_sin_normal: new_adjusted_sin_normal,
                adjusted_cos_normal: new_adjusted_cos_normal,
                low: 0.0,
                mid: 0.0,
                high: 0.0,
                kick: 0.0,
                snare: 0.0,
                hihat: 0.0,
                vocal_likelihood: 0.0,
                amplitude: 0.0,
                raw_amplitude: 0.0,
                beat_intensity: 0.0,
                bps: 0.0,
                low_dynamic: 0.0,
                mid_dynamic: 0.0,
                high_dynamic: 0.0,
                kick_dynamic: 0.0,
                snare_dynamic: 0.0,
                hihat_dynamic: 0.0,
                amplitude_dynamic: 0.0,
                raw_amplitude_dynamic: 0.0,
                spectral_flux: self.spectral_flux as f64,
                beat_times: self.beat_times.clone(),
                last_beat_time: sanitized_last_beat_time,
                quantized_bands: self.quantized_bands.iter().map(|&b| b as u32).collect(),
                spectrogram_png: None,
                spectral_centroid: 0.0,
                chromagram: vec![0.0; 12], // Default for empty data
+                beat_phase: 0.0, // Default for empty data
+                frequency_grid_map: vec![0.0; GRID_MAP_SIZE], // Default for empty data
            }
        } else {
            let sample_rate = 44100.0;
            let fft_size = frequency_data.len() * 2;
            let bin_width = sample_rate / fft_size as f32;
            let low_range = (20.0, 250.0);
            let mid_range = (250.0, 4000.0);
            let high_range = (4000.0, 20000.0);
            let kick_range = (40.0, 100.0);
            let snare_range = (120.0, 500.0);
            let hihat_range = (2000.0, 10000.0);
            let band_mean = |min_hz: f32, max_hz: f32| {
                let min_bin = (min_hz / bin_width).floor() as usize;
                let max_bin = (max_hz / bin_width).ceil() as usize;
                let bins = &frequency_data[min_bin.min(frequency_data.len())..max_bin.min(frequency_data.len())];
                if bins.is_empty() { 0.0 } else { bins.iter().copied().sum::<f32>() / bins.len() as f32 }
            };

            // --- BEGIN SPECTRAL CENTROID CALCULATION ---
            let mut weighted_sum_freq = 0.0;
            let mut sum_mag = 0.0;
            for (i, mag) in frequency_data.iter().enumerate() {
                // Each bin represents a frequency range. Use the center frequency of the bin.
                let freq = (i as f32 + 0.5) * bin_width;
                weighted_sum_freq += freq * mag;
                sum_mag += mag;
            }
            let mut spectral_centroid_value = if sum_mag > 1e-6 { weighted_sum_freq / sum_mag } else { 0.0 };
            // Normalize by Nyquist frequency (sample_rate / 2)
            let nyquist_freq = sample_rate / 2.0;
            spectral_centroid_value = if nyquist_freq > 1e-6 { spectral_centroid_value / nyquist_freq } else { 0.0 };
            // --- END SPECTRAL CENTROID CALCULATION ---

            // --- BEGIN CHROMAGRAM CALCULATION ---
            let mut chromagram_values = vec![0.0f32; 12];
            if !frequency_data.is_empty() {
                let reference_freq_a4 = 440.0f32;
                for (i, mag) in frequency_data.iter().enumerate() {
                    if *mag <= 1e-6 { continue; } // Skip silent bins
                    let freq = (i as f32 + 0.5) * bin_width; // Center frequency of the bin
                    if freq <= 0.0 { continue; }

                    // Convert frequency to MIDI note number (approximate)
                    // MIDI note = 12 * log2(freq / C0_freq) where C0_freq is reference for MIDI note 0
                    // Or, relative to A4 (MIDI note 69):
                    // MIDI note = 69 + 12 * log2(freq / 440.0)
                    let midi_note = 69.0 + 12.0 * (freq / reference_freq_a4).log2();
                    if midi_note < 0.0 { continue; }

                    let pitch_class = (midi_note.round() as i32) % 12;
                    chromagram_values[pitch_class as usize] += mag;
                }

                // Normalize chromagram (e.g., max value to 1.0)
                let max_chroma_val = chromagram_values.iter().cloned().fold(0.0f32, f32::max);
                if max_chroma_val > 1e-6 {
                    for val in chromagram_values.iter_mut() { *val /= max_chroma_val; }
                }
            }
            // --- END CHROMAGRAM CALCULATION ---

            let raw_low = band_mean(low_range.0, low_range.1);
            let raw_mid = band_mean(mid_range.0, mid_range.1);
            let raw_high = band_mean(high_range.0, high_range.1);
            let kick = band_mean(kick_range.0, kick_range.1);
            let snare = band_mean(snare_range.0, snare_range.1);
            let hihat = band_mean(hihat_range.0, hihat_range.1);
            let alpha = 0.1;
            let mut low = self.prev_low * (1.0 - alpha) + raw_low * alpha;
            let mut mid = self.prev_mid * (1.0 - alpha) + raw_mid * alpha;
            let mut high = self.prev_high * (1.0 - alpha) + raw_high * alpha;
            let max_alpha = 0.05;
            self.max_low = self.max_low * (1.0 - max_alpha) + raw_low.max(self.max_low) * max_alpha;
            self.max_mid = self.max_mid * (1.0 - max_alpha) + raw_mid.max(self.max_mid) * max_alpha;
            self.max_high = self.max_high * (1.0 - max_alpha) + raw_high.max(self.max_high) * max_alpha;
            self.max_kick = self.max_kick.max(kick);
            self.max_snare = self.max_snare.max(snare);
            self.max_hihat = self.max_hihat.max(hihat);
            low = (low / self.max_low).clamp(0.0, 1.0);
            mid = (mid / self.max_mid).clamp(0.0, 1.0);
            high = (high / self.max_high).clamp(0.0, 1.0);
            let kick = (kick / self.max_kick).clamp(0.0, 1.0);
            let snare = (snare / self.max_snare).clamp(0.0, 1.0);
            let hihat = (hihat / self.max_hihat).clamp(0.0, 1.0);
            let post_alpha = 0.15;
            low = self.prev_low * (1.0 - post_alpha) + low * post_alpha;
            mid = self.prev_mid * (1.0 - post_alpha) + mid * post_alpha;
            high = self.prev_high * (1.0 - post_alpha) + high * post_alpha;
            let raw_amplitude = (frequency_data.iter().map(|x| x * x).sum::<f32>() / frequency_data.len() as f32).sqrt();
            self.max_raw_amplitude = self.max_raw_amplitude.max(raw_amplitude);
            let mut amplitude = (raw_amplitude / self.max_raw_amplitude).clamp(0.0, 1.0);
            self.max_amplitude = self.max_amplitude.max(amplitude);
            amplitude = (amplitude / self.max_amplitude).clamp(0.0, 1.0) + 1.0;
            self.prev_low = low;
            self.prev_mid = mid;
            self.prev_high = high;
            self.prev_kick = kick;
            self.prev_snare = snare;
            self.prev_hihat = hihat;
            self.prev_amplitude = amplitude;
            self.prev_raw_amplitude = raw_amplitude;
            self.low_history.buffer.push(low);
            self.mid_history.buffer.push(mid);
            self.high_history.buffer.push(high);
            self.kick_history.buffer.push(kick);
            self.snare_history.buffer.push(snare);
            self.hihat_history.buffer.push(hihat);
            self.amplitude_history.buffer.push(amplitude);
            self.raw_amplitude_history.buffer.push(raw_amplitude);
            // Calculate dynamic values with smoothing
            let sharpness = 0.5;
            let smoothing = 0.8;
            let low_dynamic = dynamic_normalize_with_sharpness(low as f32, &self.low_history, sharpness);
            self.low_dynamic_smoothed = self.low_dynamic_smoothed * smoothing + low_dynamic * (1.0 - smoothing);
            let mid_dynamic = dynamic_normalize_with_sharpness(mid as f32, &self.mid_history, sharpness);
            self.mid_dynamic_smoothed = self.mid_dynamic_smoothed * smoothing + mid_dynamic * (1.0 - smoothing);
            let high_dynamic = dynamic_normalize_with_sharpness(high as f32, &self.high_history, sharpness);
            self.high_dynamic_smoothed = self.high_dynamic_smoothed * smoothing + high_dynamic * (1.0 - smoothing);
            let kick_dynamic = dynamic_normalize_with_sharpness(kick as f32, &self.kick_history, sharpness);
            self.kick_dynamic_smoothed = self.kick_dynamic_smoothed * smoothing + kick_dynamic * (1.0 - smoothing);
            let snare_dynamic = dynamic_normalize_with_sharpness(snare as f32, &self.snare_history, sharpness);
            self.snare_dynamic_smoothed = self.snare_dynamic_smoothed * smoothing + snare_dynamic * (1.0 - smoothing);
            let hihat_dynamic = dynamic_normalize_with_sharpness(hihat as f32, &self.hihat_history, sharpness);
            self.hihat_dynamic_smoothed = self.hihat_dynamic_smoothed * smoothing + hihat_dynamic * (1.0 - smoothing);
            let amplitude_dynamic = dynamic_normalize_with_sharpness(amplitude as f32, &self.amplitude_history, sharpness);
            self.amplitude_dynamic_smoothed = self.amplitude_dynamic_smoothed * smoothing + amplitude_dynamic * (1.0 - smoothing);
            let raw_amplitude_dynamic = dynamic_normalize_with_sharpness(raw_amplitude as f32, &self.raw_amplitude_history, sharpness);
            self.raw_amplitude_dynamic_smoothed = self.raw_amplitude_dynamic_smoothed * smoothing + raw_amplitude_dynamic * (1.0 - smoothing);

            // --- BEGIN BEAT DETECTION PIPELINE ---
            // Calculate spectral flux
            self.spectral_flux = self.calculate_spectral_flux(frequency_data, self.prev_fft_bins.as_deref());
            self.prev_fft_bins = Some(frequency_data.to_vec());

            // Determine if audio is active
            let is_audio_active = amplitude > crate::audio::constants::CONSTANTS.audio_activity_threshold;

            // Create GainState for kick, snare, hihat
            let kick_state = GainState { value: kick, gain: self.kick_gain };
            let snare_state = GainState { value: snare, gain: self.snare_gain };
            let hihat_state = GainState { value: hihat, gain: self.hihat_gain };

            // Run beat detection
            let beat_detection = self.update_beat_detection(
                kick_state,
                snare_state,
                hihat_state,
                is_audio_active,
                now,
            );

            // Update beat times and last_beat_time
            self.update_beat_times(now, beat_detection.is_beat_candidate);

            // Update beat intensity
            self.update_beat_intensity(
                beat_detection.is_beat_candidate,
                beat_detection.combined_ratio,
                beat_detection.time_since_last_beat,
            );

            // Update bps
            self.update_bps();

            // --- BEGIN FREQUENCY GRID MAP CALCULATION ---
+            let mut grid_map_values_f32 = vec![0.0f32; GRID_MAP_SIZE];
+            if !frequency_data.is_empty() {
+                let num_fft_bins = frequency_data.len();
+                for i in 0..GRID_MAP_SIZE {
+                    let start_bin = (i * num_fft_bins) / GRID_MAP_SIZE;
+                    let mut end_bin = ((i + 1) * num_fft_bins) / GRID_MAP_SIZE;
+                    if end_bin == start_bin && start_bin < num_fft_bins { // Ensure at least one bin
+                        end_bin = start_bin + 1;
+                    }
+                    end_bin = end_bin.min(num_fft_bins); // Clamp end_bin
+
+                    if start_bin < end_bin { // Ensure slice is valid
+                        let slice = &frequency_data[start_bin..end_bin];
+                        if !slice.is_empty() {
+                            let sum: f32 = slice.iter().sum();
+                            grid_map_values_f32[i] = sum / slice.len() as f32;
+                        }
+                    } else if start_bin < num_fft_bins { // Single bin fallback
+                        grid_map_values_f32[i] = frequency_data[start_bin];
+                    }
+                }
+                let max_val = grid_map_values_f32.iter().cloned().fold(0.0f32, f32::max);
+                if max_val > 1e-6 { for val in grid_map_values_f32.iter_mut() { *val /= max_val; } }
+            }
+            let frequency_grid_map_f64 = grid_map_values_f32.iter().map(|&x| x as f64).collect();
+            // --- END FREQUENCY GRID MAP CALCULATION ---
+
+            // --- BEGIN BEAT PHASE CALCULATION ---
+            let mut beat_phase_value = 0.0;
+            if self.bps > 0.1 && self.last_beat_time.is_finite() && self.last_beat_time > 0.0 {
+                let beat_duration = 1.0 / self.bps as f64;
+                let time_since_last_beat = now - self.last_beat_time;
+                if time_since_last_beat >= 0.0 {
+                    beat_phase_value = (time_since_last_beat / beat_duration) % 1.0;
+                }
+            }
+            // --- END BEAT PHASE CALCULATION ---
+
            // Compute and store quantized bands (32 log bands, quantized to u8, rolling max)
            self.quantized_bands = self.compute_quantized_bands_log_rolling(frequency_data, 32, sample_rate);

            // --- END BEAT DETECTION PIPELINE ---

            PrimaryFreq530State {
                time: self.time,
                adjusted_time: self.adjusted_time,
                sin: new_sin,
                cos: new_cos,
                sin_normal: new_sin_normal,
                cos_normal: new_cos_normal,
                adjusted_sin: new_adjusted_sin,
                adjusted_cos: new_adjusted_cos,
                adjusted_sin_normal: new_adjusted_sin_normal,
                adjusted_cos_normal: new_adjusted_cos_normal,
                low: low as f64,
                mid: mid as f64,
                high: high as f64,
                kick: kick as f64,
                snare: snare as f64,
                hihat: hihat as f64,
                vocal_likelihood: 0.0,
                amplitude: amplitude as f64,
                raw_amplitude: raw_amplitude as f64,
                beat_intensity: self.beat_intensity as f64,
                bps: self.bps as f64,
                low_dynamic: self.low_dynamic_smoothed as f64,
                mid_dynamic: self.mid_dynamic_smoothed as f64,
                high_dynamic: self.high_dynamic_smoothed as f64,
                kick_dynamic: self.kick_dynamic_smoothed as f64,
                snare_dynamic: self.snare_dynamic_smoothed as f64,
                hihat_dynamic: self.hihat_dynamic_smoothed as f64,
                amplitude_dynamic: self.amplitude_dynamic_smoothed as f64,
                raw_amplitude_dynamic: self.raw_amplitude_dynamic_smoothed as f64,
                spectral_flux: self.spectral_flux as f64,
                beat_times: self.beat_times.clone(),
                last_beat_time: sanitized_last_beat_time,
                quantized_bands: self.quantized_bands.iter().map(|&b| b as u32).collect(),
                spectrogram_png: Some(png_bytes),
                spectral_centroid: spectral_centroid_value as f64,
                chromagram: chromagram_values.iter().map(|&x| x as f64).collect(),
+                beat_phase: beat_phase_value,
+                frequency_grid_map: frequency_grid_map_f64,
            }
        };

        let should_update = now - self.last_update >= crate::audio::constants::CONSTANTS.websocket_update_interval_ms as f64 / 1000.0;
        if should_update {
            self.last_update = now;
            let fade_speed = 0.02;
            let target_value = self.amplitude_dynamic_smoothed.clamp(0.0, 1.0);
            self.fade_in_out = self.fade_in_out * (1.0 - fade_speed) + target_value * fade_speed;
            self.fade_in_out = self.fade_in_out.clamp(0.0, 1.0);
            Some(state)
        } else {
            self.pending_state = Some(state);
            None
        }
    }

    pub fn get_pending_state(&mut self) -> Option<PrimaryFreq530State> {
        self.pending_state.take()
    }

    fn normalize_decibel_value(&self, db_value: f32, min_db: f32, max_db: f32) -> f32 {
        let clamped_db = db_value.clamp(min_db, max_db);
        (clamped_db - min_db) / (max_db - min_db)
    }
    fn db_to_magnitude(&self, db: f32) -> f32 {
        if db <= crate::audio::constants::CONSTANTS.beat_detection_parameters.db_min {
            0.0
        } else {
            10.0f32.powf((db + 60.0) / 20.0).min(1.0)
        }
    }
    fn db_array_to_magnitudes(&self, db_array: &[f32]) -> Vec<f32> {
        db_array.iter().map(|&db| self.db_to_magnitude(db)).collect()
    }
    fn normalize(value: f32, history: &HistoryState) -> f32 {
        if history.max == history.min {
            value
        } else {
            (value - history.min) / (history.max - history.min)
        }
    }
    fn calculate_amplitude_rms(&self, data: &[f32]) -> f32 {
        let linear_values = self.db_array_to_magnitudes(data);
        let sum: f32 = linear_values.iter().map(|&x| x * x).sum();
        let rms = (sum / linear_values.len() as f32).sqrt();
        (rms * 4.0).min(1.0)
    }
    fn apply_envelope(&self, current: f32, previous: f32) -> f32 {
        if current >= previous {
            current
        } else {
            (previous * crate::audio::constants::CONSTANTS.decay_rate + current * (1.0 - crate::audio::constants::CONSTANTS.decay_rate)).max(0.0)
        }
    }
    fn apply_gain_and_history(value: f32, gain: f32, history: &mut HistoryState, target_min: f32, target_max: f32, gain_adjust_rate: f32) -> GainState {
        let gained_value = value * gain;
        history.buffer.push(gained_value);
        history.update_min_max(gained_value);
        let normalized_value = Self::normalize(gained_value, history);
        let new_gain = if normalized_value < target_min {
            gain + gain_adjust_rate
        } else if normalized_value > target_max {
            gain - gain_adjust_rate
        } else {
            gain
        };
        GainState {
            value: normalized_value,
            gain: new_gain.clamp(0.1, 10.0),
        }
    }
    fn update_history(&mut self, state: GainState, field: &str) {
        match field {
            "raw_amplitude" => self.raw_amplitude_gain = state.gain,
            "amplitude" => {
                self.amplitude_gain = state.gain;
                self.prev_amplitude = state.value;
            }
            "kick" => {
                self.kick_gain = state.gain;
                self.prev_kick = state.value;
            }
            "snare" => {
                self.snare_gain = state.gain;
                self.prev_snare = state.value;
            }
            "hihat" => {
                self.hihat_gain = state.gain;
                self.prev_hihat = state.value;
            }
            "low" => {
                self.low_gain = state.gain;
                self.prev_low = state.value;
            }
            "mid" => {
                self.mid_gain = state.gain;
                self.prev_mid = state.value;
            }
            "high" => {
                self.high_gain = state.gain;
                self.prev_high = state.value;
            }
            "vocal" => self.vocal_gain = state.gain,
            _ => {}
        }
    }
    fn calculate_band_magnitude(&self, fft_bins: &[f32], start_index: usize, end_index: usize) -> f32 {
        let count = (end_index - start_index).min(fft_bins.len().saturating_sub(start_index));
        if count == 0 {
            return 0.0;
        }
        let sum: f32 = fft_bins[start_index..start_index + count]
            .iter()
            .map(|&x| self.db_to_magnitude(x))
            .sum();
        sum / count as f32
    }
    fn use_frequency_ranges(&self, fft_bins: &[f32], fft_size: usize) -> (f32, f32, f32) {
        let low_end_index = (fft_size as f32 * 250.0 / crate::audio::constants::CONSTANTS.sample_rate).floor() as usize;
        let mid_end_index = (fft_size as f32 * 4000.0 / crate::audio::constants::CONSTANTS.sample_rate).floor() as usize;
        let low = self.calculate_band_magnitude(fft_bins, 0, low_end_index);
        let mid = self.calculate_band_magnitude(fft_bins, low_end_index, mid_end_index);
        let high = self.calculate_band_magnitude(fft_bins, mid_end_index, fft_bins.len());
        (low, mid, high)
    }
    fn calculate_beat_band_energy(&self, data: &[f32], min_freq: f32, max_freq: f32, sample_rate: f32) -> f32 {
        let bin_width = sample_rate / (2.0 * data.len() as f32);
        let min_bin = (min_freq / bin_width).floor() as usize;
        let max_bin = (max_freq / bin_width).ceil() as usize;
        let mut energy = 0.0;
        let mut peak_energy = f32::NEG_INFINITY;
        let mut bin_count = 0;
        for i in min_bin..max_bin.min(data.len()) {
            let db = data[i].clamp(
                crate::audio::constants::CONSTANTS.beat_detection_parameters.db_min,
                crate::audio::constants::CONSTANTS.beat_detection_parameters.db_max,
            );
            let magnitude = 10.0f32.powf(db / 10.0);
            energy += magnitude;
            peak_energy = peak_energy.max(magnitude);
            bin_count += 1;
        }
        if bin_count == 0 {
            return 0.0;
        }
        let avg_energy = energy / bin_count as f32;
        let combined_energy = peak_energy * 0.7 + avg_energy * 0.3;
        let scale = if max_freq >= crate::audio::constants::CONSTANTS.beat_detection_parameters.hihat_freq_range.min {
            crate::audio::constants::CONSTANTS.beat_detection_parameters.hihat_energy_scale
        } else {
            crate::audio::constants::CONSTANTS.beat_detection_parameters.energy_scale
        };
        (combined_energy * scale).powf(0.8).min(1.0)
    }
    fn calculate_beat_rms(&self, data: &[f32]) -> f32 {
        let sum: f32 = data.iter().map(|&x| x * x).sum();
        (sum / data.len() as f32).sqrt()
    }
    fn calculate_spectral_flux(&self, current_bins: &[f32], prev_bins: Option<&[f32]>) -> f32 {
        if let Some(prev) = prev_bins {
            let min_length = current_bins.len().min(prev.len());
            let mut flux = 0.0;
            for i in 0..min_length {
                let curr = current_bins[i].max(0.0);
                let prev = prev[i].max(0.0);
                flux += (curr - prev).max(0.0);
            }
            flux / min_length as f32
        } else {
            0.0
        }
    }
    fn update_beat_detection(&mut self, kick_state: GainState, snare_state: GainState, hihat_state: GainState, is_audio_active: bool, now: f64) -> BeatDetectionState {
        let kick_average = self.kick_average * crate::audio::constants::CONSTANTS.beat_detection_parameters.beat_alpha
            + kick_state.value * (1.0 - crate::audio::constants::CONSTANTS.beat_detection_parameters.beat_alpha);
        let snare_average = self.snare_average * crate::audio::constants::CONSTANTS.beat_detection_parameters.beat_alpha
            + snare_state.value * (1.0 - crate::audio::constants::CONSTANTS.beat_detection_parameters.beat_alpha);
        let hihat_average = self.hihat_average * crate::audio::constants::CONSTANTS.beat_detection_parameters.beat_alpha
            + hihat_state.value * (1.0 - crate::audio::constants::CONSTANTS.beat_detection_parameters.beat_alpha);
        let kick_ratio = kick_state.value / kick_average.max(crate::audio::constants::CONSTANTS.noise_floor);
        let snare_ratio = snare_state.value / snare_average.max(crate::audio::constants::CONSTANTS.noise_floor);
        let hihat_ratio = hihat_state.value / hihat_average.max(crate::audio::constants::CONSTANTS.noise_floor);
        let combined_ratio = kick_ratio * 0.6 + snare_ratio * 0.3 + hihat_ratio * 0.1;
        let time_since_last_beat = now - self.last_beat_time;
        let is_beat_candidate = is_audio_active
            && combined_ratio > crate::audio::constants::CONSTANTS.beat_detection_parameters.beat_threshold
            && self.spectral_flux > crate::audio::constants::CONSTANTS.beat_detection_parameters.spectral_flux_threshold
            && time_since_last_beat > crate::audio::constants::CONSTANTS.beat_detection_parameters.min_beat_interval as f64;
        self.kick_average = kick_average;
        self.snare_average = snare_average;
        self.hihat_average = hihat_average;
        BeatDetectionState {
            kick_average,
            snare_average,
            hihat_average,
            is_beat_candidate,
            combined_ratio,
            time_since_last_beat,
        }
    }
    fn update_beat_intensity(&mut self, is_beat_candidate: bool, combined_ratio: f32, time_since_last_beat: f64) -> f32 {
        let intensity = if is_beat_candidate {
            (self.beat_intensity
                * (1.0 - crate::audio::constants::CONSTANTS.beat_detection_parameters.beat_decay_rate * time_since_last_beat as f32)
                + combined_ratio * 0.2)
                .clamp(crate::audio::constants::CONSTANTS.beat_detection_parameters.min_beat_intensity, 1.0)
        } else {
            (self.beat_intensity
                * (1.0 - crate::audio::constants::CONSTANTS.beat_detection_parameters.beat_decay_rate * 0.5 * time_since_last_beat as f32))
                .max(crate::audio::constants::CONSTANTS.beat_detection_parameters.min_beat_intensity)
        };
        self.beat_intensity = intensity;
        intensity
    }
    fn update_beat_times(&mut self, now: f64, is_beat_candidate: bool) -> Vec<f64> {
        if is_beat_candidate {
            self.beat_times.push(now);
            self.beat_times
                .retain(|&time| now - time < crate::audio::constants::CONSTANTS.history_window_size.beat_time_window as f64);
            self.last_beat_time = now;
        }
        self.beat_times.clone()
    }
    fn calculate_instant_bps(&self) -> f32 {
        if self.beat_times.len() < 2 {
            return 0.0;
        }
        let intervals: Vec<f64> = self
            .beat_times
            .windows(2)
            .map(|w| w[1] - w[0])
            .filter(|&interval| interval > 0.1)
            .collect();
        if intervals.is_empty() {
            return 0.0;
        }
        let avg_interval = intervals.iter().sum::<f64>() / intervals.len() as f64;
        if avg_interval > 0.0 {
            1.0 / avg_interval as f32
        } else {
            0.0
        }
    }
    fn update_bps(&mut self) -> f32 {
        let instant_bps = self.calculate_instant_bps();
        self.bps = self.bps * (1.0 - crate::audio::constants::CONSTANTS.beat_detection_parameters.bps_smoothing_factor)
            + instant_bps * crate::audio::constants::CONSTANTS.beat_detection_parameters.bps_smoothing_factor;
        self.bps
    }
    fn get_harmonic_score(&self, fft_bins: &[f32]) -> f32 {
        let bin_width = crate::audio::constants::CONSTANTS.sample_rate / (2.0 * crate::audio::constants::CONSTANTS.frequency_data_buffer_size as f32);
        let min_bin = (crate::audio::constants::CONSTANTS.vocal_freq_min / bin_width).floor() as usize;
        let max_bin = (crate::audio::constants::CONSTANTS.vocal_freq_max / bin_width).ceil() as usize;
        let slice = &fft_bins[min_bin..max_bin.min(fft_bins.len())];
        let max_amplitude = slice.iter().copied().fold(f32::NEG_INFINITY, f32::max);
        let normalized_fft: Vec<f32> = slice
            .iter()
            .map(|&v| if max_amplitude > 0.0 { v / max_amplitude } else { 0.0 })
            .collect();
        let mut harmonic_count = 0;
        for fundamental_bin in 0..(max_bin - min_bin) / 2 {
            let fundamental_freq = (fundamental_bin + min_bin) as f32 * bin_width;
            if normalized_fft.get(fundamental_bin).copied().unwrap_or(0.0) > crate::audio::constants::CONSTANTS.harmonic_threshold {
                let mut harmonics_found = 0;
                for harmonic in (2..=crate::audio::constants::CONSTANTS.harmonic_count + 1).step_by(2) {
                    let harmonic_bin = ((fundamental_freq * harmonic as f32) / bin_width).round() as usize;
                    if harmonic_bin < normalized_fft.len()
                        && normalized_fft[harmonic_bin] > crate::audio::constants::CONSTANTS.harmonic_threshold
                    {
                        harmonics_found += 1;
                    }
                }
                if harmonics_found >= crate::audio::constants::CONSTANTS.harmonic_count / 2 {
                    harmonic_count += 1;
                }
            }
        }
        if harmonic_count > 0 {
            (harmonic_count as f32 / 5.0).min(1.0)
        } else {
            0.0
        }
    }
    fn calculate_mid_variance(&self) -> f32 {
        let values = self
            .mid_history
            .buffer
            .values()
            .iter()
            .copied()
            .take(crate::audio::constants::CONSTANTS.history_window_size.vocal_variance_window)
            .collect::<Vec<f32>>();
        if values.len() < 2 {
            return 0.0;
        }
        let mean = values.iter().sum::<f32>() / values.len() as f32;
        let variance = values
            .iter()
            .map(|&x| (x - mean).powi(2))
            .sum::<f32>()
            / values.len() as f32;
        (variance / crate::audio::constants::CONSTANTS.vocal_max_variance).min(1.0)
    }
    /// Compute N logarithmic frequency bands from FFT data, quantize to u8 (0-255), with rolling max normalization
    fn compute_quantized_bands_log_rolling(
        &mut self,
        frequency_data: &[f32],
        num_bands: usize,
        sample_rate: f32,
    ) -> Vec<u8> {
        let min_freq = 20.0;
        let max_freq = sample_rate / 2.0;
        let n_bins = frequency_data.len();
        let mut bands = vec![0.0; num_bands];
        for band in 0..num_bands {
            let start_freq = min_freq * (max_freq / min_freq).powf(band as f32 / num_bands as f32);
            let end_freq = min_freq * (max_freq / min_freq).powf((band + 1) as f32 / num_bands as f32);
            let start_bin = ((start_freq / max_freq) * n_bins as f32).floor() as usize;
            let end_bin = ((end_freq / max_freq) * n_bins as f32).ceil() as usize;
            let slice = &frequency_data[start_bin.min(n_bins)..end_bin.min(n_bins)];
            bands[band] = if slice.is_empty() { 0.0 } else { slice.iter().copied().sum::<f32>() / slice.len() as f32 };
        }
        // Rolling max normalization
        let max_val = bands.iter().cloned().fold(0.0, f32::max);
        let alpha = 0.05; // Smoothing factor for rolling max
        self.rolling_max_bands = self.rolling_max_bands * (1.0 - alpha) + max_val * alpha;
        let norm = self.rolling_max_bands.max(1e-6); // Avoid divide by zero
        let bands_normalized: Vec<f32> = bands.iter().map(|&b| (b / norm).clamp(0.0, 1.0)).collect();
        // Quantize to u8
        bands_normalized.iter().map(|&b| (b * 255.0).round() as u8).collect()
    }
}

impl From<&crate::state::PrimaryFreq530State> for ProtoState {
    fn from(s: &crate::state::PrimaryFreq530State) -> Self {
        ProtoState {
            time: s.time,
            adjusted_time: s.adjusted_time,
            sin: s.sin,
            cos: s.cos,
            sin_normal: s.sin_normal,
            cos_normal: s.cos_normal,
            adjusted_sin: s.adjusted_sin,
            adjusted_cos: s.adjusted_cos,
            adjusted_sin_normal: s.adjusted_sin_normal,
            adjusted_cos_normal: s.adjusted_cos_normal,
            low: s.low,
            mid: s.mid,
            high: s.high,
            kick: s.kick,
            snare: s.snare,
            hihat: s.hihat,
            vocal_likelihood: s.vocal_likelihood,
            amplitude: s.amplitude,
            raw_amplitude: s.raw_amplitude,
            beat_intensity: s.beat_intensity,
            bps: s.bps,
            low_dynamic: s.low_dynamic,
            mid_dynamic: s.mid_dynamic,
            high_dynamic: s.high_dynamic,
            kick_dynamic: s.kick_dynamic,
            snare_dynamic: s.snare_dynamic,
            hihat_dynamic: s.hihat_dynamic,
            amplitude_dynamic: s.amplitude_dynamic,
            raw_amplitude_dynamic: s.raw_amplitude_dynamic,
            spectral_flux: s.spectral_flux,
            beat_times: s.beat_times.clone(),
            last_beat_time: s.last_beat_time,
            quantized_bands: s.quantized_bands.clone(),
            spectrogram_png: s.spectrogram_png.clone(),
            spectral_centroid: s.spectral_centroid,
            chromagram: s.chromagram.clone(),
            beat_phase: s.beat_phase,
+            frequency_grid_map: s.frequency_grid_map.clone(),
        }
    }
}
// --- END IMPL FROM OLD MAIN.RS ---

#[allow(dead_code)]
pub mod proto_mod {
    include!(concat!(env!("OUT_DIR"), "/_.rs"));
}
pub use proto_mod::PrimaryFreq530State as ProtoState;

fn dynamic_normalize(value: f32, history: &HistoryState) -> f32 {
    let values = history.buffer.values();
    let n = values.len() as f32;
    if n < 2.0 {
        return 0.5;
    }
    let mean = values.iter().sum::<f32>() / n;
    let std = (values.iter().map(|&x| (x - mean).powi(2)).sum::<f32>() / n).sqrt().max(1e-6);
    let z = (value - mean) / std;
    1.0 / (1.0 + (-z).exp())
}

fn dynamic_normalize_with_sharpness(value: f32, history: &HistoryState, sharpness: f32) -> f32 {
    let values = history.buffer.values();
    let n = values.len() as f32;
    if n < 2.0 {
        return 0.5;
    }
    let mean = values.iter().sum::<f32>() / n;
    let std = (values.iter().map(|&x| (x - mean).powi(2)).sum::<f32>() / n).sqrt().max(1e-6);
    let z = sharpness * (value - mean) / std;
    1.0 / (1.0 + (-z).exp())
} 