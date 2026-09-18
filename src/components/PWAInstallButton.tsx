import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and opened in standalone mode, do not show button
  if (isInstalled) {
    return null;
  }

  // Android / Chromium / Edge / Chrome prompt
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1.5 rounded-full transition shadow-xs active:scale-95"
        title="安装到手机桌面"
      >
        <Download className="w-3.5 h-3.5 text-orange-600" />
        <span>安装App</span>
      </button>
    );
  }

  // iOS Safari guide
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1.5 rounded-full transition shadow-xs active:scale-95"
          title="添加到主屏幕"
        >
          <Download className="w-3.5 h-3.5 text-orange-600" />
          <span>安装App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-black">
                    吃
                  </span>
                  <h3 className="text-base font-bold text-stone-900">安装「今天吃什么」到桌面</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-stone-600 leading-relaxed">
                <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    点击 Safari 底部工具栏的「<span className="font-semibold text-stone-800">分享</span>」按钮（方框带向上箭头图标）。
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    在弹出面板中向下滚动，找到并轻点「<span className="font-semibold text-stone-800">添加到主屏幕</span>」。
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    点击右上角「<span className="font-semibold text-stone-800">添加</span>」，即可像原生 App 一样全屏无地址栏使用！
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
