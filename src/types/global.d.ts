interface Toast {
  info: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

interface Window {
  toast: Toast;
} 