"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type ExportFormat = "video+audio" | "audio-only" | "video-only";
export type QualityPreset = "low" | "medium" | "high" | "ultra";
export type OutputFormat = "mp4" | "webm" | "mov" | "mkv" | "mp3" | "wav";

interface ExportOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
}

export interface ExportOptions {
  format: ExportFormat;
  quality: QualityPreset;
  outputFormat: OutputFormat;
}

export function ExportOptionsModal({
  open,
  onOpenChange,
  onExport,
}: ExportOptionsModalProps) {
  const [format, setFormat] = React.useState<ExportFormat>("video+audio");
  const [quality, setQuality] = React.useState<QualityPreset>("medium");
  const [outputFormat, setOutputFormat] = React.useState<OutputFormat>("mp4");

  // Update output format based on export format
  React.useEffect(() => {
    if (format === "audio-only") {
      if (outputFormat !== "mp3" && outputFormat !== "wav") {
        setOutputFormat("mp3");
      }
    } else {
      if (outputFormat === "mp3" || outputFormat === "wav") {
        setOutputFormat("mp4");
      }
    }
  }, [format, outputFormat]);

  const getAvailableOutputFormats = (): OutputFormat[] => {
    if (format === "audio-only") {
      return ["mp3", "wav"];
    }
    return ["mp4", "webm", "mov", "mkv"];
  };

  const handleExport = () => {
    onExport({ format, quality, outputFormat });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
          <DialogDescription>
            Configure your export settings. Choose format, quality, and output
            file type.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Export Format Selection */}
          <div className="grid gap-2">
            <Label htmlFor="format">Export Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video+audio" id="video+audio" />
                <Label htmlFor="video+audio" className="font-normal cursor-pointer">
                  Video + Audio
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="audio-only" id="audio-only" />
                <Label htmlFor="audio-only" className="font-normal cursor-pointer">
                  Audio Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video-only" id="video-only" />
                <Label htmlFor="video-only" className="font-normal cursor-pointer">
                  Video Only
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Quality Preset Selection */}
          <div className="grid gap-2">
            <Label htmlFor="quality">Quality Preset</Label>
            <Select
              value={quality}
              onValueChange={(value) => setQuality(value as QualityPreset)}
            >
              <SelectTrigger id="quality">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Fast Export)</SelectItem>
                <SelectItem value="medium">Medium (Balanced)</SelectItem>
                <SelectItem value="high">High (Good Quality)</SelectItem>
                <SelectItem value="ultra">Ultra (Best Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Output Format Selection */}
          <div className="grid gap-2">
            <Label htmlFor="outputFormat">Output Format</Label>
            <Select
              value={outputFormat}
              onValueChange={(value) => setOutputFormat(value as OutputFormat)}
            >
              <SelectTrigger id="outputFormat">
                <SelectValue placeholder="Select output format" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableOutputFormats().map((fmt) => (
                  <SelectItem key={fmt} value={fmt}>
                    {fmt.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="rounded-md bg-muted p-3 text-xs">
            <p className="font-medium">Export Summary:</p>
            <p className="text-muted-foreground mt-1">
              Format: {format} | Quality: {quality} | Output:{" "}
              {outputFormat.toUpperCase()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
