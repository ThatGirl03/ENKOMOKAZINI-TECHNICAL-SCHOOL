import { useState } from "react";
import { X, LogIn, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Simple authentication: username = school name, password = provided password
    const validUsername = "enkomokazini";
    const validPassword = "enkomokazini2025"; // updated admin password

    if (username.toLowerCase() === validUsername && password.toLowerCase() === validPassword) {
      toast({
        title: "Login Successful!",
        description: "Welcome to the admin dashboard.",
      });
      onLoginSuccess();
      onClose();
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-elevated w-full max-w-md p-8 animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-accent" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Admin Login</h2>
          <p className="text-muted-foreground mt-2">Enter your credentials to access the dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter school name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold transition-all hover:shadow-gold-glow hover:scale-[1.02]"
          >
            <LogIn size={20} />
            Login
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Contact the school administration if you need access.
        </p>
      </div>
    </div>
  );
};
