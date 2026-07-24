import React, { useEffect, useState } from 'react'
import AppRouter from "./routes/AppRouter";
import ToastContainer from "./components/ui/ToastContainer";
import SplashScreen from "./components/ui/SplashScreen";
import { useAuthStore } from "./store/authStore";

function App() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    hydrate();
  }, []);
  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <AppRouter />
      <ToastContainer />
    </>
  )
}

export default App