/**
 * Boot splash — matches the real app: white screen, the Safaricom | M-PESA
 * logo and a small frosted "Loading..." pill with a spinner.
 */
export function AppSplash() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="rounded-2xl bg-black/75 px-6 py-5 backdrop-blur-md">
          <div className="mx-auto h-7 w-7 rounded-full border-[3px] border-white/25 border-t-white animate-[spin_0.8s_linear_infinite]" />
          <p className="mt-2 text-[13px] font-medium text-white">Loading...</p>
        </div>
        <img
          src="/mpesa-logo.png"
          alt="Safaricom M-PESA"
          className="w-[76%] max-w-[320px] object-contain"
        />
      </div>
    </div>
  );
}

export default AppSplash;
