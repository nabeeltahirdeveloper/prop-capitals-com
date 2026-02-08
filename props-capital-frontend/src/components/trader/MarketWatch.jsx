import React, { useState } from 'react'
import { IoMdSearch } from 'react-icons/io'
import { useTraderTheme } from './TraderPanelLayout'

const MarketWatch = ({
    symbols = [],
    selectedSymbol,
    onSymbolSelect,
    symbolsLoading = false,
    isOpen
}) => {

    // ✅ FIX 1: hook call
    const { isDark } = useTraderTheme()

    const [searchQuery, setSearchQuery] = useState('')

    const filteredSymbols = symbols.filter(symbol =>
        symbol.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const forexSymbols = filteredSymbols.filter(
        s => !s.symbol.toUpperCase().endsWith('USDT')
    )
    const cryptoSymbols = filteredSymbols.filter(
        s => s.symbol.toUpperCase().endsWith('USDT')
    )

    return (
        <div
            className={`border-l flex flex-col h-full shrink-0
        ${isDark
                    ? 'bg-[#0d1117] border-white/10'
                    : 'bg-white border-slate-200'
                }`}
        >

            {/* Search */}
            <div className={`p-3 border-b flex items-center gap-2
        ${isDark ? 'border-white/10' : 'border-slate-200'}
      `}>
                <IoMdSearch className={`text-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                <input
                    type="text"
                    placeholder="Search symbol"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded text-sm focus:outline-none
            ${isDark
                            ? 'bg-[#161b22] text-slate-100 placeholder:text-slate-500'
                            : 'bg-slate-100 text-slate-800 placeholder:text-slate-400'
                        }`}
                />
            </div>

            {/* Symbols */}
            <div className="flex-1 overflow-y-auto">
                {symbolsLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            Loading symbols...
                        </span>
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead className={`sticky top-0
              ${isDark ? 'bg-[#0d1117]' : 'bg-slate-100'}
            `}>
                            <tr>
                                {['Symbol', 'Bid', 'Ask', 'Change'].map(h => (
                                    <th key={h}
                                        className={`px-3 py-2 text-left font-medium
                      ${isDark ? 'text-slate-400' : 'text-slate-600'}
                    `}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {forexSymbols.length > 0 && (
                                <tr>
                                    <td colSpan={4}
                                        className={`px-3 py-2 font-semibold
                      ${isDark ? 'text-sky-400' : 'text-sky-600'}
                    `}
                                    >
                                        FOREX
                                    </td>
                                </tr>
                            )}

                            {[...forexSymbols, ...cryptoSymbols].map(symbol => (
                                <tr
                                    key={symbol.symbol}
                                    onClick={() => onSymbolSelect(symbol.symbol)}
                                    className={`cursor-pointer transition
                    ${selectedSymbol === symbol.symbol
                                            ? isDark
                                                ? 'bg-[#161b22]'
                                                : 'bg-sky-50'
                                            : isDark
                                                ? 'hover:bg-[#161b22]'
                                                : 'hover:bg-slate-100'
                                        }`}
                                >
                                    <td className={`px-3 py-2 font-medium
                    ${isDark ? 'text-slate-100' : 'text-slate-800'}
                  `}>
                                        {symbol.symbol}
                                    </td>
                                    <td className="px-3 py-2 text-right text-sky-400">{symbol.bid}</td>
                                    <td className="px-3 py-2 text-right text-sky-400">{symbol.ask}</td>
                                    <td className={`px-3 py-2 text-right font-medium
                    ${symbol.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                  `}>
                                        {symbol.change >= 0 ? '+' : ''}{symbol.change}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default MarketWatch
