import { useState } from "react";
import { useTraderTheme } from "./TraderPanelLayout";

export default function MT5Login({
  onPlatformLogin,
  onPasswordReset,
  isSubmitting = false,
  isResetting = false,
}) {
  const { isDark } = useTraderTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const pageClass = isDark ? "bg-[#0a0d12]" : "bg-white";
  const cardClass = isDark
    ? "border-white/10 bg-[#12161d]"
    : "border-gray-200 bg-white";
  const titleClass = isDark ? "text-white" : "text-gray-900";
  const labelClass = isDark ? "text-gray-300" : "text-gray-900";
  const mutedClass = isDark ? "text-gray-400" : "text-gray-600";
  const inputClass = isDark
    ? "text-white bg-white/5 border-white/10 placeholder:text-gray-500 focus:border-sky-400/80 focus:ring-sky-400/20"
    : "text-black border-gray-300 bg-white placeholder:text-gray-400 focus:border-sky-400 focus:ring-sky-100";

  function onSubmit(e) {
    e.preventDefault();
    if (!isSubmitting) {
      onPlatformLogin(email, password);
    }
  }

  return (
    <div className={`h-full flex items-center justify-center p-6 ${pageClass}`}>
      <div
        className={`w-full max-w-xl overflow-hidden rounded-md border shadow-[0_16px_46px_8px_rgba(0,0,0,0.12)] ${cardClass}`}
      >
        {/* Header bar */}
        <div className="bg-blue-500 px-4 py-3 text-xs font-medium text-white mb-2">
          Trading accounts: MetaQuotes Ltd..
        </div>

        <form onSubmit={onSubmit} autoComplete="off" className="max-w-xl p-5">
          <h2 className={`text-base ${titleClass}`}>Connect to account</h2>

          <div className="mt-5 grid grid-cols-[1fr_2fr_2fr] items-center gap-x-4 gap-y-3">
            {/* Email */}
            <label className={`text-xs ${labelClass}`}>Email</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter Login"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-8 border px-3 text-xs outline-none focus:ring-2 ${inputClass}`}
            />

            <div />

            {/* Password */}
            <label className={`text-xs ${labelClass}`}>Password</label>
            <div className="flex items-center gap-4">
              <input
                type="password"
                name="password"
                autoComplete="off"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-8 flex-1 border px-3 text-xs outline-none focus:ring-2 ${inputClass}`}
              />
            </div>

            {/* Save Password */}
            <label className={`flex items-center gap-2 text-xs ${mutedClass}`}>
              <input
                type="checkbox"
                className={`h-4 w-4 text-blue-600 focus:ring-blue-200 ${
                  isDark ? "border-white/20 bg-white/5" : "border-gray-300"
                }`}
              />
              <span>Save password</span>
            </label>

            <div />
            <div className={`text-xs ${mutedClass}`}>
              <span>Forgot Password?</span>{" "}
              <button
                type="button"
                disabled={isResetting || isSubmitting}
                className="text-blue-500 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => onPasswordReset()}
              >
                {isResetting ? "Sending..." : "Send reset credentials"}
              </button>
            </div>
            <div />

            {/* Server */}
            <label className={`text-xs ${labelClass}`}>Server</label>
            <div className={`text-xs ${labelClass}`}>MetaQuotes</div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || isResetting}
              className="h-8 rounded bg-green-500 border border-green-600 px-2 text-sm text-white hover:bg-green-600"
            >
              {isSubmitting ? "Connecting..." : "Connect to account"}
            </button>
          </div>
        </form>

        {/* <div className=" px-4 pb-4 pt-2 text-xs text-gray-500">
          <div>© 2000 - 2026, MetaQuotes Ltd.</div>
          <a
            href="https://www.metaquotes.net/licenses/terminal/mt5"
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-blue-600 hover:underline"
          >
            End-User License Agreement
          </a>
        </div>*/}
      </div>
    </div>
  );
}
