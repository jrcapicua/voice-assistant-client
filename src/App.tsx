import { ThemeProvider } from "@/contexts/theme/theme-provider";
import VoiceAssistant from "./components/VoiceAssistant"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <VoiceAssistant />
    </ThemeProvider>
  );
}

export default App;
