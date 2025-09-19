import { Mode, applyMode } from "@cloudscape-design/global-styles";
import { Link, Outlet } from "react-router";
import { RefreshCcw } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

export const App = () => {
  useEffect(() => {
    applyMode(Mode.Dark);
  }, []);

  return (
    <>
      <div
        className={`min-h-screen bg-gradient-to-br from-black to-slate-900 overflow-hidden`}
      >
        <div className="container mx-auto p-4">
          {/* Header */}
          <header className="py-3 border-b border-slate-700/50 mb-4">
            <Link
              to={"/"}
              className="flex items-center space-x-2 hover:cursor-pointer p-2"
            >
              <RefreshCcw className="h-6 w-6 text-cyan-500" />
              <span className="text-l font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Migration Monitor
              </span>
            </Link>
          </header>

          <Outlet />
        </div>
      </div>

      {/* TODO: Styling  */}
      <Toaster position="bottom-left" />
    </>
  );
};
