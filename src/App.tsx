import { RouterProvider } from 'react-router-dom';
import { router } from './router'; //  Adjust path
import { Toaster } from "@/components/ui/sonner" // For toast notifications

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;