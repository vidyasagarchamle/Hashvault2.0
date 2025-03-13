"use client";

import { useState } from "react";

export default function FileTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    console.log("Input event triggered");
    
    try {
      const files = event.target.files;
      console.log("Files object:", files);
      
      if (!files || files.length === 0) {
        console.log("No files selected");
        return;
      }
      
      const file = files[0];
      console.log("File details:", {
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
        lastModified: file.lastModified
      });
      
      setSelectedFile(file);
    } catch (err) {
      console.error("Error in file selection:", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">File Upload Test</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Method 1: Standard Input</h2>
          <input 
            type="file"
            onChange={handleFileChange}
            className="w-full border p-2 rounded"
          />
        </div>
        
        <div>
          <h2 className="text-lg font-medium mb-2">Method 2: Audio-specific</h2>
          <input 
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="w-full border p-2 rounded"
          />
        </div>
        
        <div>
          <h2 className="text-lg font-medium mb-2">Method 3: Video-specific</h2>
          <input 
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="w-full border p-2 rounded"
          />
        </div>
        
        <div>
          <h2 className="text-lg font-medium mb-2">Method 4: Explicit Extensions</h2>
          <input 
            type="file"
            accept=".mp3,.wav,.mp4,.mov"
            onChange={handleFileChange}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {selectedFile && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-medium mb-2">Selected File:</h3>
          <ul className="space-y-1">
            <li><strong>Name:</strong> {selectedFile.name}</li>
            <li><strong>Type:</strong> {selectedFile.type || "unknown"}</li>
            <li><strong>Size:</strong> {Math.round(selectedFile.size / 1024)} KB</li>
          </ul>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Browser Information:</p>
        <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto">
          {typeof window !== 'undefined' ? navigator.userAgent : 'Server Rendered'}
        </pre>
      </div>
    </div>
  );
} 