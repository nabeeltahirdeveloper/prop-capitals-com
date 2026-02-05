import React, { useState } from 'react'
import { MdLogout, MdAdd, MdRemove } from 'react-icons/md'
import { useContext } from 'react'
// import { AuthContext } from '../../context/Auth'
import { useNavigate } from 'react-router-dom'
import { useTrading } from '@/contexts/TradingContext' 

const TopBar = ({ selectedSymbol, selectedTimeframe, onTimeframeChange, chartType = 'candles', onChartTypeChange, onNewOrder, onZoomIn, onZoomOut, onToggleBuySell, onDownloadChartPNG, onToggleFullscreen, marketWatchOpen = true, onToggleMarketWatch,  buySellPanelOpen }) => {
    const { theme } = useTrading()
    const isLight = theme === 'light'
    const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN']
    // const { dispatch, user } = useContext(AuthContext)
    const navigate = useNavigate()
    const symbolDescriptions = {
        'CADJPY': 'Canadian Dollar vs Yen',
        'EURUSD': 'Euro vs US Dollar',
        'AUDUSD': 'Australian Dollar vs US Dollar',
        'GBPUSD': 'British Pound vs US Dollar',
        'USDJPY': 'US Dollar vs Japanese Yen',
        'XAUUSD': 'Gold vs US Dollar',
        'BTCUSD': 'Bitcoin vs US Dollar',
        'AUDTHB': 'Australian Dollar vs Thai Baht',
    }

    const symbolDescription = symbolDescriptions[selectedSymbol] || selectedSymbol

    // Chart type icons mapping - SVG code (you can replace with your own SVG)
    const chartTypeIcons = {
        bars: (


            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" d="M0 0h24v24H0z" />
                <path fillRule="evenodd" d="M20.999 15.002H19v3a1 1 0 0 1-2.001 0V8H15a1 1 0 1 1 0-2h1.999v-3A1 1 0 1 1 19 3v10h1.999a1 1 0 0 1 0 2Zm-10.999-4H6.999v10a1 1 0 1 1-1.999 0v-3H3a1 1 0 0 1 0-2h2v-11a1 1 0 1 1 1.999 0V9H10a1 1 0 0 1 0 2Z" clipRule="evenodd" fill="currentColor" />
            </svg>
        ),
        candles: (

            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3V9H11V18H9V21H7V18H5V9H7V3H9ZM17 3V6H19V16H17V19H15V16H13V6H15V3H17ZM17 8H15V14H17V8Z" fill="currentColor" />
            </svg>

        ),
        area: (
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="m2.166 16.571 7.013-7.194c.38-.583 1.116-.273 1.707.256l4.14 2.31 5.136-6.692c.277-.425 1.853-.182 1.853-.182v13.952H2.047a7.772 7.772 0 0 1 .119-2.45Z" opacity=".2" fill="currentColor" />
                <path d="M3.027 18.011a1 1 0 0 1-.81-1.58c.81-1.128 1.5-2.154 2.113-3.065 1.938-2.887 3.22-4.795 5.234-5.042 1.607-.195 3.364.683 6.28 3.212l4.35-6.086a1 1 0 0 1 1.626 1.16l-4.994 6.99a1 1 0 0 1-1.483.16c-2.824-2.552-4.481-3.587-5.536-3.454-1.108.136-2.186 1.742-3.82 4.173-.621.927-1.323 1.971-2.148 3.117a1.001 1.001 0 0 1-.812.415Z" fill="currentColor" />
            </svg>
        ),
        line: (
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M3.027 18.011a1 1 0 0 1-.81-1.58c.81-1.128 1.5-2.154 2.113-3.065 1.938-2.887 3.22-4.795 5.234-5.042 1.607-.195 3.364.683 6.28 3.212l4.35-6.086a1 1 0 0 1 1.626 1.16l-4.994 6.99a1 1 0 0 1-1.483.16c-2.824-2.552-4.481-3.587-5.536-3.454-1.108.136-2.186 1.742-3.82 4.173-.621.927-1.323 1.971-2.148 3.117a1.001 1.001 0 0 1-.812.415Z" fill="currentColor" />
            </svg>
        ),

        volume: (
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" d="M0 0h24v24H0z" />
                <path fillRule="evenodd" d="M19.024 17.844H19a1 1 0 0 1-1-1V13a1 1 0 0 1 1-1h.024a1 1 0 0 1 1 1v3.844a1 1 0 0 1-1 1Zm-3 0H16a1 1 0 0 1-1-1v-5.845A1 1 0 0 1 16 10h.024a1 1 0 0 1 1 .999v5.845a1 1 0 0 1-1 1Zm-3 0H13a1 1 0 0 1-1-1V6.999A1 1 0 0 1 13 6h.024a1 1 0 0 1 1 .999v9.845a1 1 0 0 1-1 1Zm-3 0H10a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1h.024a1 1 0 0 1 1 1v4.844a1 1 0 0 1-1 1Zm-3 0H7a1 1 0 0 1-1-1V9.999A.999.999 0 0 1 7 9h.024a1 1 0 0 1 1 .999v6.845a1 1 0 0 1-1 1Zm-3 0H4a1 1 0 0 1-1-1v-2.845a1 1 0 0 1 1-1h.024a1 1 0 0 1 1 1v2.845a1 1 0 0 1-1 1Z" clipRule="evenodd" fill="currentColor" />
            </svg>
        ),
        'volume ticks': (
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h24v24H0z" fill="none" />
                <path fillRule="evenodd" d="M20.009 6.993h-.985v3.985a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1V6.993h-.946c-.565 0-1.023-.441-1.023-.985v-.024c0-.543.458-.984 1.023-.984h3.955c.565 0 1.023.441 1.023.984v.024c0 .544-.458.985-1.023.985Zm-3.985 6.14v5.845a1 1 0 0 1-1 1H15a1 1 0 0 1-1-1v-5.845a1 1 0 0 1 1-.999h.024a1 1 0 0 1 1 .999Zm-4 6.845H12a1 1 0 0 1-1-1V9.133a1 1 0 0 1 1-.999h.024a1 1 0 0 1 1 .999v9.845a1 1 0 0 1-1 1Zm-3 0H9a1 1 0 0 1-1-1v-4.844a1 1 0 0 1 1-1h.024a1 1 0 0 1 1 1v4.844a1 1 0 0 1-1 1Zm-3 0H6a1 1 0 0 1-1-1v-6.845a.998.998 0 0 1 1-.999h.024a1 1 0 0 1 1 .999v6.845a1 1 0 0 1-1 1Zm-3 0H3a1 1 0 0 1-1-1v-2.845a1 1 0 0 1 1-1h.024a1 1 0 0 1 1 1v2.845a1 1 0 0 1-1 1ZM18 14.134h.024a1 1 0 0 1 1 1v3.844a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1v-3.844a1 1 0 0 1 1-1Z" clipRule="evenodd" fill="currentColor" />
            </svg>
        ),
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        dispatch({ type: "SET_LOGGED_OUT" })
        window.notify("User successfully loged out", "success")
        navigate("/")
    }

    return (
        <div className={`flex items-center justify-between px-4 py-1 border-b ${isLight ? 'bg-white border-slate-200' : 'bg-primary border-slate-700'}`}>
            {/* Left: Chart Type + Timeframes */}
            <div className='flex items-center gap-4'>
                {/* Chart type: Bars, Candles, Line, Area (LEFT side) */}
                <div className={`flex items-center gap-1 border-r pr-3 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
                    {['bars', 'candles', 'line', 'area'].map((type) => (
                        <button
                            key={type}
                            onClick={() => onChartTypeChange(type)}
                            className={`px-1 py-1.5 text-[11px] font-medium rounded transition-colors capitalize flex items-center gap-1.5 
                                ${chartType === type
                                    ? 'text-secondary'
                                    : isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-[#E5F4FF]' : 'text-white hover:text-slate-200 hover:bg-slate-800'
                                }
                            `}
                            title={type}
                        >
                            {chartTypeIcons[type]}
                            {/* <span>{type}</span> */}
                        </button>
                    ))}
                </div>

                {/* Volume types: Volume Ticks, Volume (separated with border) */}
                <div className={`flex items-center gap-1 border-r ${isLight ? "border-slate-200" : "border-slate-700"} pr-1`}>
                    {['volume ticks', 'volume'].map((type) => (
                        <button
                            key={type}
                            onClick={() => onChartTypeChange(type)}
                            className={`px-1 py-1.5 text-[11px] font-medium rounded transition-colors capitalize flex items-center gap-1.5 
                                ${chartType === type
                                    ? 'text-secondary'
                                    : isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-[#E5F4FF]' : 'text-white hover:text-slate-200 hover:bg-slate-800'
                                }
                            `}
                            title={type}
                        >
                            {chartTypeIcons[type]}
                            {/* <span>{type}</span> */}
                        </button>
                    ))}
                </div>

                {/* Timeframes (RIGHT side of chart type buttons) */}
                <div className='flex items-center gap-2'>
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => onTimeframeChange(tf)}
                            className={`px-1.5 py-2 text-sm font-medium rounded transition-colors ${selectedTimeframe === tf
                                ? 'text-secondary'
                                : isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-[#E5F4FF]' : 'text-white hover:text-slate-200 hover:bg-slate-800'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                    {/* Border line before Order Button */}
                    <div className={`border-r h-6 mx-1 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}></div>
                    {/* Toggle Buy/Sell Panel Button */}
                    {/* <button
                        onClick={onToggleBuySell}
                        className={`p-2 rounded transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-[#E5F4FF]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                        title="Toggle Buy/Sell Panel"
                    > */}
                    <button
                        onClick={() => onToggleBuySell?.()}
                        title={buySellPanelOpen ? 'Hide Buy/Sell on Chart' : 'Show Buy/Sell on Chart'}
                        className={`px-2 py-2 flex justify-center items-center rounded transition-colors ${buySellPanelOpen ? (isLight ? 'text-sky-600 bg-sky-50 hover:bg-[#E5F4FF]' : 'text-sky-400 bg-slate-700 hover:bg-[#25303C]') : (isLight ? 'text-slate-600 hover:text-sky-600 hover:bg-[#E5F4FF]' : 'text-slate-200 hover:bg-[#25303C]')}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <g fill="none" fillRule="evenodd">
                                <path fill="#DA5244" d="M11.5 5v4H9c-1.054 0-1.918.816-1.995 1.85L7 11v2c0 1.105.895 2 2 2h2.5v4H4c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h7.5z"></path>
                                <path fill="#3687ED" d="M20 5c1.105 0 2 .895 2 2v10c0 1.105-.895 2-2 2h-7.5v-4H15c1.054 0 1.918-.816 1.995-1.85L17 13v-2c0-1.105-.895-2-2-2h-2.5V5H20z"></path>
                                <path fill="#B0BEC5" d="M10 10h4c1.105 0 2 .895 2 2s-.895 2-2 2h-4c-1.105 0-2-.895-2-2s.895-2 2-2z"></path>
                            </g>
                        </svg>
                    </button>

                    {/* Order Button - After last timeframe (MN) - Professional Trading Terminal */}
                    <button
                        onClick={onNewOrder}
                        className={`px-2 py-2 flex justify-center items-center gap-1 cursor-pointer text-xs font-medium rounded transition-colors ${isLight ? 'text-secondary hover:bg-[#E5F4FF]' : 'text-white hover:bg-[#25303C]'}`}
                    >
                        <svg width={24} height={24} viewBox='0 0 24 24 ' xmlns='http://www.w3.org/2000/svg'>
                            <g fill='none' fillRule="evenodd">
                                <path fill='#DA5244' d="M11.5 4v2.02C8.42 6.276 6 8.856 6 12c0 3.145 2.42 5.725 5.5 5.98V20H10c-4.418 0-8-3.582-8-8s3.582-8 8-8h1.5z">
                                </path>
                                <path fill="#3687ED" d="M14 4c4.418 0 8 3.582 8 8s-3.582 8-8 8h-1.5v-2.02c3.08-.256 5.5-2.836 5.5-5.98 0-3.145-2.42-5.725-5.5-5.98V4H14z">
                                </path>
                                <path fill="#B0BEC5" d="M13 8v4.186l2.657 2.657-1.414 1.414L11 13V8z"></path>
                            </g >
                        </svg>
                        <span className="button-text svelte-1iwf8ix">New Order</span>
                    </button>

                    {/* Border line after Order Button */}
                    <div className={`border-r ${isLight ? "border-slate-200" : "border-slate-700"} h-6 mx-1`}></div>

                    {/* Zoom In/Out Buttons */}
                    <div className='flex items-center gap-1'>
                        <button
                            onClick={onZoomIn}
                            className={`p-1 ${isLight ? "text-slate-700 hover:bg-[#E5F4FF]" : "text-white hover:bg-slate-800"}   rounded transition-colors`}
                            title="Zoom In"
                        >
                            <MdAdd className='w-5 h-5' />
                        </button>
                        <button
                            onClick={onZoomOut}
                            className={`p-2 ${isLight ? "text-slate-700 hover:bg-[#E5F4FF]" : "text-white  hover:bg-slate-800"}   rounded transition-colors`}
                            title="Zoom Out"
                        >
                            <MdRemove className='w-5 h-5' />
                        </button>






                        {/* Border line after Order Button */}
                        <div className={`border-r ${isLight ? "border-slate-200" : "border-slate-700"} h-6 mx-1`}></div>
                        {/* Add Indicator */}
                        <button
                            onClick={onNewOrder}
                            className={`px-2 py-2 flex justify-center items-center gap-1 cursor-pointer text-xs font-medium rounded transition-colors ${isLight ? 'text-slate-600 hover:text-sky-600 hover:bg-[#E5F4FF]' : 'text-slate-200 hover:bg-[#25303C]'}`}
                        >
                            <svg width={24} height={24} xmlns='http://www.w3.org/2000/svg' fill="currentColor">
                                <path fillRule="evenodd" d="M14.057 18.177c.786 0 1.369-.451 1.763-.934.391-.48.699-1.108.954-1.763.474-1.22.861-2.791 1.22-4.312l-2.258.828c-.26 1.04-.527 1.991-.826 2.759-.226.58-.443.982-.64 1.223-.121.15-.194.19-.219.199-.312-.003-.62-.16-.964-.895-.354-.757-.586-1.809-.842-3.019l-.026-.122c-.235-1.108-.497-2.35-.932-3.316-.454-1.009-1.261-2.06-2.715-2.06-1.21 0-2.038.943-2.57 1.82-.562.93-1.022 2.16-1.4 3.449l2.378-.83c.233-.624.478-1.16.734-1.583.472-.78.782-.856.858-.856.26 0 .55.124.891.88.343.763.568 1.818.825 3.033l.004.019c.241 1.138.515 2.43.984 3.433.48 1.025 1.317 2.047 2.781 2.047Zm-.016-1.998s.004-.002.01-.002l-.01.002Z" clipRule="evenodd" />
                                <path d="m5.752 15.75-2.187.763a94.295 94.295 0 0 0-.554 3.34 1 1 0 1 0 1.978.295c.183-1.226.434-2.799.763-4.397Z" />
                                <path fillRule="evenodd" d="m16.845 7.46 2.353-.864.068-.191c.216-.585.422-.99.607-1.232A.784.784 0 0 1 20.038 5 1 1 0 0 0 20 3c-.791 0-1.354.485-1.717.96-.365.478-.653 1.102-.893 1.753-.194.526-.375 1.12-.546 1.746Zm3.211-2.47-.009.004c.006-.004.009-.004.009-.004Z" clipRule="evenodd" />
                                <path d="M21.942 7.664a1 1 0 0 1-.605 1.278l-7 2.5a1 1 0 0 1-.673-1.884l7-2.5a1 1 0 0 1 1.278.606ZM8.86 13.433a1 1 0 1 0-.719-1.866l-6.5 2.5a1 1 0 0 0 .718 1.866l6.5-2.5Z" />
                            </svg>
                        </button>
                        {/* Border line after Order Button */}
                        <div className={`border-r ${isLight ? "border-slate-200" : "border-slate-700"} h-6 mx-1`}></div>
                        {/* Economic calendar */}
                        <button
                            onClick={onNewOrder}
                            className={`px-2 py-2 flex justify-center items-center gap-1 cursor-pointer text-xs font-medium rounded transition-colors ${isLight ? 'text-secondary hover:bg-[#E5F4FF]' : 'text-slate-200 hover:bg-[#25303C]'}`}
                        >
                            <svg width={24} height={24} viewBox="0 0 24 24" xmlns='http://www.w3.org/2000/svg' fill="currentColor">
                                <path fillRule="evenodd" d="M9 4V5H15V4H17V5H19C20.1046 5 21 5.89543 21 7V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V7C3 5.89543 3.89543 5 5 5H7V4H9ZM7 7H6C5.44772 7 5 7.44772 5 8V17C5 17.5523 5.44772 18 6 18H18C18.5523 18 19 17.5523 19 17V8C19 7.44772 18.5523 7 18 7H17V8H15V7H9V8H7V7ZM13 14V16H11V14H13ZM9 14V16H7V14H9ZM17 14V16H15V14H17ZM13 10V12H11V10H13ZM17 10V12H15V10H17Z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {/* Border line after Order Button */}
                        <div className={`border-r ${isLight ? "border-slate-200" : "border-slate-700"} h-6 mx-1`}></div>
                        {/* Market Watch: one click = close, one click = open */}
                        <button
                            type="button"
                            onClick={() => onToggleMarketWatch?.()}
                            title={marketWatchOpen ? 'Close Market Watch' : 'Open Market Watch'}
                            className={`px-2 py-2 flex justify-center items-center gap-1 cursor-pointer text-xs font-medium rounded transition-colors ${marketWatchOpen ? (isLight ? 'text-sky-600 bg-sky-50 hover:bg-[#E5F4FF]' : 'text-sky-400 bg-slate-700 hover:bg-[#25303C]') : (isLight ? 'text-slate-600 hover:text-sky-600 hover:bg-[#E5F4FF]' : 'text-slate-200 hover:bg-[#25303C]')}`}
                        >
                            <svg width={24} height={24} viewBox="0 0 24 24" xmlns='http://www.w3.org/2000/svg' fill="currentColor">
                                <path d="M15 7H7v2h8V7ZM7 15h5v2H7v-2ZM17 11H7v2h10v-2Z" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14Zm-1 2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h12Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>



            {/* Right: Actions */}
            <div className='flex items-center gap-3'>

                <button
                    type="button"
                    onClick={() => onDownloadChartPNG?.()}
                    title="Download chart as PNG"
                    className={`p-2 rounded transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="inline-block" fill="currentColor">
                        <path d="M22 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-4a1 1 0 0 1-1-1V4h-1a1 1 0 1 1 0-2h1a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Zm1 7v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8l3.764-1s.45-.428.789-1.105l.171-.342a.998.998 0 0 1 .894-.553h4.764a1 1 0 0 1 .894.552l.171.342c.339.678.789 1.106.789 1.106L23 13Zm-8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM16 4h-2a1 1 0 1 1 0-2h2a1 1 0 1 1 0 2Zm-6 0H8a1 1 0 0 1 0-2h2a1 1 0 1 1 0 2ZM4 22H3a2 2 0 0 1-2-2v-1a1 1 0 1 1 2 0v1h1a1 1 0 1 1 0 2ZM4 4H3v1a1 1 0 0 1-2 0V4a2 2 0 0 1 2-2h1a1 1 0 0 1 0 2ZM2 8a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Zm0 5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Z" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={() => onToggleFullscreen?.()}
                    title="Full screen (F11)"
                    className={`p-2 rounded transition-colors ${isLight ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4' />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default TopBar

