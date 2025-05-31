"use client"

import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { useAudioStreamStore } from '../stores/useAudioSourceStore';

interface AudioStreamState {
  deviceId: string;
  audioDevices: MediaDeviceInfo[];
  isAudioStreamSetup: boolean;
  selectedFile: string;
  isFilePlaying: boolean;
  availableFiles: string[];
}

const AudioDeviceSelector: React.FC = () => {
  const audioDevices = useAudioStreamStore((state: AudioStreamState) => state.audioDevices);
  const isSetup = useAudioStreamStore((state: AudioStreamState) => state.isAudioStreamSetup);
  const availableFiles = useAudioStreamStore((state: AudioStreamState) => state.availableFiles);
  const selectedFile = useAudioStreamStore((state: AudioStreamState) => state.selectedFile);
  const isFilePlaying = useAudioStreamStore((state: AudioStreamState) => state.isFilePlaying);
  
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [loopbackDeviceId, setLoopbackDeviceId] = useState<string | null>(null);
  const [macbookproDeviceId, setMacbookproDeviceId] = useState<string | null>(null);
  const [showAllDevices, setShowAllDevices] = useState(false);

  const { setupAudio, listAudioDevices, playAudioFile, stopAudioFile, stopAudioStream, setSelectedFile } = useAudioStreamStore();

  useEffect(() => {
    listAudioDevices();
  }, []);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    useAudioStreamStore.setState({ deviceId });
  };

  useEffect(() => {
    const loopBackId = audioDevices.find((device: MediaDeviceInfo) => device.label.toLowerCase().includes('loopback audio (virtual)'))?.deviceId;
    const macProMicId = audioDevices.find((device: MediaDeviceInfo) => device.label.toLowerCase().includes('microphone'))?.deviceId;
    if(loopBackId) setLoopbackDeviceId(loopBackId);
    if(macProMicId) setMacbookproDeviceId(macProMicId);
  }, [audioDevices]);

  const connect = (deviceId: string) => {
    stopAudioFile(); // Stop any playing audio file
    useAudioStreamStore.setState({ deviceId });
    setupAudio();
  };

  const handleFilePlayback = async () => {
    stopAudioStream(); // Stop any active stream
    if (isFilePlaying) {
      stopAudioFile();
    } else {
      await playAudioFile(selectedFile);
    }
  };

  const deviceSelector = (
    <div className="mx-4 mb-4">
      <Select onValueChange={handleDeviceChange} value={selectedDevice}>
        <SelectTrigger className="w-full">
          {selectedDevice
            ? audioDevices.find((device: MediaDeviceInfo) => device.deviceId === selectedDevice)?.label ||
              'Unnamed Device'
            : 'Select a device'}
        </SelectTrigger>
        <SelectContent>
          {audioDevices.map((device: MediaDeviceInfo, index: number) => (
            <SelectItem key={`${device.deviceId}-${index}`} value={device.deviceId}>
              {device.label || 'Unnamed Device'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const fileSelector = (
    <div className="mx-1 mb-0">
      <Select value={selectedFile} onValueChange={setSelectedFile}>
        <SelectTrigger className="w-full">
          {selectedFile.split('/').pop() || 'Select a file'}
        </SelectTrigger>
        <SelectContent>
          {availableFiles.map((file: string, index: number) => (
            <SelectItem key={index} value={file}>
              {file.split('/').pop()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const classes = cn({
    'fixed bottom-0 right-0 border-2 m-1 p-2 rounded-lg z-[40]': true,
    'border-green-500 text-green-500 text-xs': isSetup,
    'border-orange-500 text-red-500': !isSetup
  });

  return (
    <div className={classes}>
      <label htmlFor="audioDeviceSelect">Select Audio Source: </label>
      
      <div className="p-1 flex gap-1">
        {loopbackDeviceId && <Button variant="outline" onClick={() => connect(loopbackDeviceId)}>Spotify</Button>}
        {macbookproDeviceId && <Button variant="outline" onClick={() => connect(macbookproDeviceId)}>Microphone</Button>}
        <Button 
          onClick={handleFilePlayback}
          variant={isFilePlaying ? "outline" : "default"}
        >
          {isFilePlaying ? "Stop" : "Play"} File
        </Button>

        <div className="flex items-center space-x-1 text-lime">
          <Checkbox
            id="devices"
            checked={showAllDevices}
            onCheckedChange={() => setShowAllDevices(!showAllDevices)}
          />
          <label
            htmlFor="devices"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show All
          </label>
        </div>
      </div>

      {showAllDevices && deviceSelector}
      {fileSelector}
    </div>
  );
};

export default AudioDeviceSelector;
