import { Outlet } from 'react-router-dom';
import { ModeToggle } from '@/components/mode-toggle'; //  Adjust path

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Outlet />
    </div>
  );
};
export default AuthLayout;