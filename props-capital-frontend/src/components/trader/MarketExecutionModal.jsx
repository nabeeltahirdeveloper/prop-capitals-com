// import React, { useState, useEffect, useRef } from 'react'
// import { useTrading } from '@/contexts/TradingContext'
// import { createTrade } from '@/api/trades'
// import { getCurrentPrice } from '@/api/market-data'
// import socket from '@/lib/socket'

// const norm = (s) => (s || '').replace(/\//g, '').toUpperCase()

// const MarketExecutionModal = ({ isOpen, onClose, orderType: initialOrderType }) => {
//     const { selectedSymbol, setOrders, currentSymbolData } = useTrading()

//     const [volume, setVolume] = useState('0.01')
//     const [stopLoss, setStopLoss] = useState('')
//     const [takeProfit, setTakeProfit] = useState('')
//     const [comment, setComment] = useState('')
//     const [loading, setLoading] = useState(false)
//     const [loadingOrderType, setLoadingOrderType] = useState(null)
//     const [error, setError] = useState('')
//     const [activeOrderType, setActiveOrderType] = useState(initialOrderType || 'BUY')

//     const [realTimeBid, setRealTimeBid] = useState(0)
//     const [realTimeAsk, setRealTimeAsk] = useState(0)
//     const [bidColor, setBidColor] = useState('text-white')
//     const [askColor, setAskColor] = useState('text-white')
//     const prevBidRef = useRef(0)
//     const prevAskRef = useRef(0)

//     const selectedNorm = norm(selectedSymbol)

//     const applyPriceUpdate = (bid, ask) => {
//         const newBid = parseFloat(bid) || 0
//         const newAsk = parseFloat(ask) || 0
//         if (newBid > 0) {
//             if (newBid > prevBidRef.current && prevBidRef.current > 0) {
//                 setBidColor('text-green-400')
//                 setTimeout(() => setBidColor('text-white'), 500)
//             } else if (newBid < prevBidRef.current && prevBidRef.current > 0) {
//                 setBidColor('text-red-400')
//                 setTimeout(() => setBidColor('text-white'), 500)
//             }
//             setRealTimeBid(newBid)
//             prevBidRef.current = newBid
//         }
//         if (newAsk > 0) {
//             if (newAsk > prevAskRef.current && prevAskRef.current > 0) {
//                 setAskColor('text-green-400')
//                 setTimeout(() => setAskColor('text-white'), 500)
//             } else if (newAsk < prevAskRef.current && prevAskRef.current > 0) {
//                 setAskColor('text-red-400')
//                 setTimeout(() => setAskColor('text-white'), 500)
//             }
//             setRealTimeAsk(newAsk)
//             prevAskRef.current = newAsk
//         }
//     }

//     // 1) Initial from context when modal opens
//     useEffect(() => {
//         if (!isOpen) return
//         const bid = parseFloat(currentSymbolData?.bid) || 0
//         const ask = parseFloat(currentSymbolData?.ask) || 0
//         if (bid > 0 || ask > 0) {
//             setRealTimeBid((v) => (bid > 0 ? bid : v))
//             setRealTimeAsk((v) => (ask > 0 ? ask : v))
//             if (bid > 0) prevBidRef.current = bid
//             if (ask > 0) prevAskRef.current = ask
//         }
//     }, [isOpen, currentSymbolData?.bid, currentSymbolData?.ask])

//     // 2) Socket priceUpdate (when backend sends it) + normalized symbol match
//     useEffect(() => {
//         if (!isOpen) return
//         const handlePriceUpdate = (data) => {
//             if (!data?.symbol || norm(data.symbol) !== selectedNorm) return
//             applyPriceUpdate(data.bid, data.ask)
//         }
//         socket.on('priceUpdate', handlePriceUpdate)
//         return () => socket.off('priceUpdate', handlePriceUpdate)
//     }, [isOpen, selectedNorm])

//     // 3) REST polling every 2s so bid/ask update even without socket priceUpdate
//     useEffect(() => {
//         if (!isOpen || !selectedSymbol) return
//         const fetch = () => {
//             getCurrentPrice(selectedSymbol).then((res) => {
//                 if (res?.bid != null || res?.ask != null) applyPriceUpdate(res.bid, res.ask)
//             }).catch(() => {})
//         }
//         fetch()
//         const interval = setInterval(fetch, 2000)
//         return () => clearInterval(interval)
//     }, [isOpen, selectedSymbol])

//     useEffect(() => {
//         if (isOpen) {
//             setVolume('0.01')
//             setStopLoss('')
//             setTakeProfit('')
//             setComment('')
//             setError('')
//             setActiveOrderType(initialOrderType || 'BUY')
//         }
//     }, [isOpen, initialOrderType])

//     // Get symbol description
//     const symbolDescriptions = {
//         'EURUSD': 'Euro vs US Dollar',
//         'AUDUSD': 'Australian Dollar vs US Dollar',
//         'GBPUSD': 'British Pound vs US Dollar',
//         'USDJPY': 'US Dollar vs Japanese Yen',
//         'XAUUSD': 'Gold vs US Dollar',
//         'BTCUSD': 'Bitcoin vs US Dollar',
//     }

//     const symbolDescription = symbolDescriptions[selectedSymbol] || selectedSymbol

//     // Calculate volume in base currency (simplified - assuming 1 lot = 100,000)
//     const volumeInBaseCurrency = (parseFloat(volume) || 0) * 100000
//     // Use real-time prices (professional trading terminal)
//     const currentPrice = parseFloat(activeOrderType === 'BUY' ? realTimeAsk : realTimeBid) || 0
//     const bidPriceNum = realTimeBid || 0
//     const askPriceNum = realTimeAsk || 0

//     const handleVolumeChange = (delta) => {
//         const current = parseFloat(volume) || 0.01
//         const newVolume = Math.max(0.01, current + delta)
//         setVolume(newVolume.toFixed(2))
//     }

//     const handleStopLossChange = (delta) => {
//         const current = parseFloat(stopLoss) || 0
//         const currentPrice = parseFloat(activeOrderType === 'BUY' ? realTimeAsk : realTimeBid) || 0

//         if (!currentPrice) {
//             setError('Current price not available. Please wait...')
//             return
//         }

//         let newSL = current + delta

//         // For BUY: SL must be below current price
//         // For SELL: SL must be above current price
//         if (activeOrderType === 'BUY') {
//             newSL = Math.max(0.00001, Math.min(newSL, currentPrice - 0.00001))
//         } else {
//             newSL = Math.max(currentPrice + 0.00001, newSL)
//         }

//         setStopLoss(newSL > 0 ? newSL.toFixed(5) : '')
//         setError('') // Clear error on valid change
//     }

//     const handleTakeProfitChange = (delta) => {
//         const current = parseFloat(takeProfit) || 0
//         const currentPrice = parseFloat(activeOrderType === 'BUY' ? realTimeAsk : realTimeBid) || 0

//         if (!currentPrice) {
//             setError('Current price not available. Please wait...')
//             return
//         }

//         let newTP = current + delta

//         // For BUY: TP must be above current price
//         // For SELL: TP must be below current price
//         if (activeOrderType === 'BUY') {
//             newTP = Math.max(currentPrice + 0.00001, newTP)
//         } else {
//             newTP = Math.max(0.00001, Math.min(newTP, currentPrice - 0.00001))
//         }

//         setTakeProfit(newTP > 0 ? newTP.toFixed(5) : '')
//         setError('') // Clear error on valid change
//     }

//     const handleSubmit = async (submitOrderType) => {
//         // Clear previous errors
//         setError('')

//         // Use submitted order type or active order type
//         const finalOrderType = submitOrderType || activeOrderType
//         // Use real-time prices (professional trading terminal)
//         const orderPrice = parseFloat(finalOrderType === 'BUY' ? realTimeAsk : realTimeBid)
//         const orderVolume = parseFloat(volume)
//         const slValue = stopLoss ? parseFloat(stopLoss) : null
//         const tpValue = takeProfit ? parseFloat(takeProfit) : null

//         // Validation: Volume
//         if (!orderVolume || orderVolume <= 0 || isNaN(orderVolume)) {
//             setError('Please enter a valid volume (minimum 0.01)')
//             return
//         }

//         if (orderVolume < 0.01) {
//             setError('Volume must be at least 0.01')
//             return
//         }

//         // Validation: Price
//         if (!orderPrice || orderPrice <= 0 || isNaN(orderPrice)) {
//             setError('Invalid price. Please refresh and try again.')
//             return
//         }

//         // Validation: Stop Loss (if provided)
//         if (slValue !== null && slValue !== '') {
//             if (isNaN(slValue) || slValue <= 0) {
//                 setError('Stop Loss must be a valid positive number')
//                 return
//             }

//             // SL validation based on order type
//             if (finalOrderType === 'BUY' && slValue >= orderPrice) {
//                 setError('Stop Loss must be below the current price for BUY orders')
//                 return
//             }
//             if (finalOrderType === 'SELL' && slValue <= orderPrice) {
//                 setError('Stop Loss must be above the current price for SELL orders')
//                 return
//             }
//         }

//         // Validation: Take Profit (if provided)
//         if (tpValue !== null && tpValue !== '') {
//             if (isNaN(tpValue) || tpValue <= 0) {
//                 setError('Take Profit must be a valid positive number')
//                 return
//             }

//             // TP validation based on order type (PROFESSIONAL TRADING LOGIC)
//             // BUY: TP must be ABOVE entry price (we want price to go UP)
//             // SELL: TP must be BELOW entry price (we want price to go DOWN)
//             if (finalOrderType === 'BUY') {
//                 if (tpValue <= orderPrice) {
//                     setError(`Take Profit must be above the entry price (${orderPrice.toFixed(5)}) for BUY orders`)
//                     return
//                 }
//             } else if (finalOrderType === 'SELL') {
//                 if (tpValue >= orderPrice) {
//                     setError(`Take Profit must be below the entry price (${orderPrice.toFixed(5)}) for SELL orders`)
//                     return
//                 }
//             }
//         }

//         // Set active order type for validation
//         setActiveOrderType(finalOrderType)
//         setLoadingOrderType(finalOrderType)
//         setLoading(true)

//         // CRITICAL: Capture time IMMEDIATELY when user clicks (real-time)
//         const clickTime = new Date()
//         const realTimeString = clickTime.toLocaleTimeString()

//         // Generate temp ID for error handling
//         const tempOrderId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

//         // Check if user is logged in
//         const token = localStorage.getItem('token')
//         if (!token) {
//             setError('Please login to place trades')
//             setLoading(false)
//             setLoadingOrderType(null)
//             return
//         }

//         // Prepare trade data (userId will be extracted from token on backend)
//         const tradeData = {
//             symbol: selectedSymbol,
//             type: finalOrderType,
//             volume: orderVolume,
//             price: orderPrice,
//             takeProfit: tpValue,
//             stopLoss: slValue,
//             comment: comment.trim() || null
//         }

//         // OPTIMISTIC UPDATE: Create order immediately with real-time click time
//         // This shows the order instantly with exact click time
//         const optimisticOrder = {
//             ticket: tempOrderId.substring(0, 8),
//             symbol: selectedSymbol,
//             type: finalOrderType,
//             volume: parseFloat(orderVolume),
//             price: parseFloat(orderPrice),
//             time: realTimeString, // REAL-TIME: Exact click time
//             stopLoss: slValue ? parseFloat(slValue) : null,
//             takeProfit: tpValue ? parseFloat(tpValue) : null,
//             swap: 0,
//             profit: 0,
//             profitCurrency: 'USD',
//             comment: comment.trim() || '',
//             id: tempOrderId,
//             status: 'OPEN',
//             openAt: clickTime.toISOString()
//         }

//         // Add optimistic order immediately (real-time display)
//         if (setOrders) {
//             setOrders((prev) => [...prev, optimisticOrder])
//         }

//         // PROFESSIONAL UX: Hide loading and close modal immediately after optimistic update
//         // User sees order instantly, API call happens in background
//         setLoading(false)
//         setLoadingOrderType(null)
//         onClose() // Close modal immediately - order is already visible

//         createTrade(tradeData)
//             .then((res) => {
//                 const savedTrade = res?.data?.trade ?? res?.trade
//                 if (savedTrade) {
//                     if (setOrders) {
//                         setOrders((prev) => prev.map(order =>
//                             order.id === tempOrderId
//                                 ? {
//                                     ...order,
//                                     id: savedTrade.id,
//                                     ticket: String(savedTrade.id ?? '').substring(0, 8),
//                                     time: realTimeString,
//                                     openAt: savedTrade.openedAt ?? savedTrade.openAt
//                                 }
//                                 : order
//                         ))
//                     }
//                     if (window.notify) {
//                         window.notify(`Trade placed successfully: ${savedTrade.symbol} ${savedTrade.type}`, 'success')
//                     }
//                 } else {
//                     if (setOrders) setOrders((prev) => prev.filter(order => order.id !== tempOrderId))
//                     if (window.notify) window.notify(res?.message || 'Failed to place trade', 'error')
//                 }
//             })
//             .catch((err) => {
//                 if (setOrders) setOrders((prev) => prev.filter(order => order.id !== tempOrderId))
//                 let errorMsg = 'Failed to place trade'
//                 if (err?.response) {
//                     const d = err.response?.data
//                     if (err.response.status === 401) errorMsg = 'Authentication failed. Please login again.'
//                     else if (err.response.status === 404) errorMsg = d?.message || 'Symbol not found.'
//                     else errorMsg = d?.message || errorMsg
//                 } else if (err?.request) errorMsg = 'Network error. Please check your connection.'
//                 if (window.notify) window.notify(errorMsg, 'error')
//             })
//     }

//     // Format volume in base currency (CAD example)
//     const volumeDisplay = (parseFloat(volume) || 0) * 100000
//     const formattedVolume = volumeDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

//     if (!isOpen) return null

//     return (
//         <div className='w-full max-w-sm bg-primary border border-slate-700 rounded-lg shadow-2xl flex flex-col pointer-events-auto' style={{ maxHeight: '95vh', marginTop: '57px' }}>
//             {/* Header - Market Execution with dropdown and close */}
//             <div className='px-4 py-2.5  border-slate-700 flex items-center justify-between bg-primary '>
//                         <div className='flex items-center gap-2'>
//                             <h3 className='text-sm font-semibold text-white'>Market Execution</h3>
//                             <button className='p-0.5 text-white hover:text-white transition-colors'>
//                                 <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
//                                     <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
//                                 </svg>
//                             </button>
//                         </div>
//                         <button
//                             onClick={onClose}
//                             className='p-1 text-white hover:text-white hover:bg-primary rounded transition-colors'
//                         >
//                             <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
//                                 <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
//                             </svg>
//                         </button>
//             </div>

//             {/* Content - Scrollable */}
//             <div className='overflow-y-auto p-4 space-y-4' style={{ maxHeight: 'calc(90vh - 60px)' }}>
//                 {/* Error Message */}
//                 {error && (
//                     <div className='p-2 rounded-lg bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs'>
//                         {error}
//                     </div>
//                 )}

//                 {/* Volume Section */}
//                 <div>
//                     <div className='flex items-center justify-between mb-2'>
//                         <label className='text-sm text-white font-medium'>Volume</label>
//                         <span className='text-sm text-white'>{formattedVolume} CAD</span>
//                     </div>
//                     <div className='relative flex items-center'>
//                         <button
//                             type='button'
//                             onClick={() => handleVolumeChange(-0.01)}
//                             className='absolute left-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
//                         >
//                             −
//                         </button>
//                         <input
//                             type='number'
//                             value={volume}
//                             onChange={(e) => {
//                                 setVolume(e.target.value)
//                                 setError('')
//                             }}
//                             className='w-full px-10 py-2 bg-primary border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-secondary text-center'
//                             step='0.01'
//                             min='0.01'
//                             placeholder='0.01'
//                         />
//                         <button
//                             type='button'
//                             onClick={() => handleVolumeChange(0.01)}
//                             className='absolute right-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
//                         >
//                             +
//                         </button>
//                     </div>
//                 </div>

//                 {/* Stop Loss and Take Profit - Side by Side */}
//                 <div className='grid grid-cols-2 gap-3'>
//                     {/* Stop Loss */}
//                     <div>
//                         <div className='flex items-center justify-between mb-2'>
//                             <label className='text-sm text-white font-medium'>Stop Loss</label>
//                         </div>
//                         <div className='relative flex items-center'>
//                             <button
//                                 type='button'
//                                 onClick={() => handleStopLossChange(-0.0001)}
//                                 className='absolute left-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
//                                 title='Decrease SL'
//                             >
//                                 −
//                             </button>
//                             <input
//                                 type='text'
//                                 value={stopLoss}
//                                 onChange={(e) => {
//                                     const value = e.target.value
//                                     // Allow empty, numbers, and decimal point
//                                     if (value === '' || /^\d*\.?\d*$/.test(value)) {
//                                         setStopLoss(value)
//                                         setError('')
//                                     }
//                                 }}
//                                 onBlur={(e) => {
//                                     // Format to 5 decimal places when user finishes typing
//                                     const numValue = parseFloat(e.target.value)
//                                     if (!isNaN(numValue) && numValue > 0) {
//                                         setStopLoss(numValue.toFixed(5))
//                                     } else if (e.target.value === '') {
//                                         setStopLoss('')
//                                     }
//                                 }}
//                                 placeholder='0.00000'
//                                 className='w-full px-10 py-2 bg-primary border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-secondary text-center'
//                             />
//                             <button
//                                 type='button'
//                                 onClick={() => handleStopLossChange(0.0001)}
//                                 className='absolute right-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
//                                 title='Increase SL'
//                             >
//                                 +
//                             </button>
//                         </div>
//                     </div>

//                     {/* Take Profit */}
//                     <div>
//                         <div className='flex items-center justify-between mb-2'>
//                             <label className='text-sm text-white font-medium'>Take Profit</label>
//                         </div>
//                         <div className='relative flex items-center'>
//                             <button
//                                 type='button'
//                                 onClick={() => handleTakeProfitChange(-0.0001)}
//                                 className='absolute left-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
//                                 title='Decrease TP'
//                             >
//                                 −
//                             </button>
//                             <input
//                                 type='text'
//                                 value={takeProfit}
//                                 onChange={(e) => {
//                                     const value = e.target.value
//                                     // Allow empty, numbers, and decimal point
//                                     if (value === '' || /^\d*\.?\d*$/.test(value)) {
//                                         setTakeProfit(value)
//                                         setError('')
//                                     }
//                                 }}
//                                 onBlur={(e) => {
//                                     // Format to 5 decimal places when user finishes typing
//                                     const numValue = parseFloat(e.target.value)
//                                     if (!isNaN(numValue) && numValue > 0) {
//                                         setTakeProfit(numValue.toFixed(5))
//                                     } else if (e.target.value === '') {
//                                         setTakeProfit('')
//                                     }
//                                 }}
//                                 placeholder='0.00000'
//                                 className='w-full px-10 py-2 bg-primary border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-secondary text-center'
//                             />
//                             <button
//                                 type='button'
//                                 onClick={() => handleTakeProfitChange(0.0001)}
//                                 className='absolute right-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
//                                 title='Increase TP'
//                             >
//                                 +
//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Comment */}
//                 <div>
//                     <label className='block text-sm text-white font-medium mb-2'>Comment</label>
//                     <textarea
//                         value={comment}
//                         onChange={(e) => setComment(e.target.value)}
//                         placeholder='Optional comment'
//                         rows={2}
//                         className='w-full px-3 py-2 bg-primary border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-secondary resize-none'
//                     />
//                 </div>

//                 {/* Bid/Ask Prices - Real-time with color changes (Professional Trading Terminal) */}
//                 <div className='flex items-center justify-between py-2 border-t border-slate-700'>
//                     <div className='text-sm'>
//                         <span className='text-white'>Bid: </span>
//                         <span className={`${bidColor} font-medium transition-colors duration-200`}>
//                             {bidPriceNum > 0 ? bidPriceNum.toFixed(5) : '---'}
//                         </span>
//                     </div>
//                     <div className='text-sm'>
//                         <span className='text-white'>Ask: </span>
//                         <span className={`${askColor} font-medium transition-colors duration-200`}>
//                             {askPriceNum > 0 ? askPriceNum.toFixed(5) : '---'}
//                         </span>
//                     </div>
//                 </div>

//                 {/* Buy and Sell Buttons - Side by Side */}
//                 <div className='grid grid-cols-2 gap-3 pt-2'>
//                     <button
//                         onClick={() => handleSubmit('SELL')}
//                         disabled={loading}
//                         className='px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
//                     >
//                         {loading && loadingOrderType === 'SELL' ? (
//                             <span className='flex items-center justify-center gap-2'>
//                                 <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
//                                     <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
//                                     <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
//                                 </svg>
//                                 Placing...
//                             </span>
//                         ) : (
//                             'Sell by Market'
//                         )}
//                     </button>
//                     <button
//                         onClick={() => handleSubmit('BUY')}
//                         disabled={loading}
//                         className='px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
//                     >
//                         {loading && loadingOrderType === 'BUY' ? (
//                             <span className='flex items-center justify-center gap-2'>
//                                 <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
//                                     <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
//                                     <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
//                                 </svg>
//                                 Placing...
//                             </span>
//                         ) : (
//                             'Buy by Market'
//                         )}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     )
// }

//     export default MarketExecutionModal





import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
    Minus,
    Plus,
    X,
    ChevronDown
} from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export default function MarketExecutionModal({
    selectedSymbol,
    accountBalance = 100000,
    onExecuteTrade,
    maxLotSize = 100,
    chartPrice,
    disabled = false,
    isOpen,
    onClose,
    orderType: initialOrderType,
    positionInChart = false
}) {
    const { t } = useTranslation();
    const [orderType, setOrderType] = useState('limit');
    const [tradeDirection, setTradeDirection] = useState('buy');
    const [lotSize, setLotSize] = useState(0.01);
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [limitPrice, setLimitPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [leveragePercent, setLeveragePercent] = useState(25);

    // Default symbol if none selected
    const defaultSymbol = {
        symbol: 'EUR/USD',
        bid: 1.08542,
        ask: 1.08557,
        spread: 1.5,
        change: 0.05
    };

    const symbol = selectedSymbol && selectedSymbol.symbol ? selectedSymbol : defaultSymbol;

    const leverage = 100;

    // Check if symbol is crypto - derived directly from symbol
    const isCrypto = symbol.symbol.includes('BTC') || symbol.symbol.includes('ETH') ||
        symbol.symbol.includes('SOL') || symbol.symbol.includes('XRP') ||
        symbol.symbol.includes('ADA') || symbol.symbol.includes('DOGE');

    // Contract size: 1 for crypto, 100000 for forex
    const contractSize = isCrypto ? 1 : 100000;

    // Reset lot size when symbol changes
    useEffect(() => {
        // Set a reasonable default based on asset type and account balance
        if (isCrypto) {
            setLotSize(0.1); // 0.1 BTC
        } else {
            setLotSize(1.0); // 1.0 lot = standard lot
        }
        setLeveragePercent(25);
    }, [symbol.symbol]);

    // Set trade direction based on initialOrderType when modal opens
    useEffect(() => {
        if (isOpen && initialOrderType) {
            const direction = initialOrderType.toLowerCase();
            if (direction === 'buy' || direction === 'sell') {
                setTradeDirection(direction);
            }
        }
    }, [isOpen, initialOrderType]);

    const calculateMargin = () => {
        const margin = lotSize * contractSize * symbol.bid / leverage;
        return margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const calculateOrderValue = () => {
        const value = lotSize * contractSize * symbol.bid;
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Calculate lot size from percentage of account balance (as margin)
    const calculateLotSizeFromPercent = (percent) => {
        // With 100x leverage:
        // margin = lotSize * contractSize * price / leverage
        // So: lotSize = (margin * leverage) / (contractSize * price)
        const marginToUse = accountBalance * (percent / 100);
        const price = symbol.bid;

        if (!price || price === 0) return isCrypto ? 0.01 : 0.1;

        // lotSize = (marginToUse * leverage) / (contractSize * price)
        const newLotSize = (marginToUse * leverage) / (contractSize * price);

        // For crypto, round to 4 decimals; for forex, round to 2 decimals
        const decimals = isCrypto ? 4 : 2;
        const minLot = isCrypto ? 0.0001 : 0.01;

        const result = Math.max(minLot, Math.min(newLotSize, maxLotSize));
        return parseFloat(result.toFixed(decimals));
    };

    const handleTrade = async () => {
        console.log('=== TradingPanel handleTrade START ===');
        console.log('Symbol:', symbol);
        console.log('onExecuteTrade:', typeof onExecuteTrade);

        if (isSubmitting) {
            console.log('Already submitting, returning');
            return;
        }

        // Get market price - prefer chart price (real-time), then symbol data, then fallback
        const basePrice = chartPrice || symbol?.bid || 1.08542;
        // Add small spread for ask price
        const spread = isCrypto ? basePrice * 0.001 : 0.00015;
        const marketPrice = tradeDirection === 'buy'
            ? basePrice + spread
            : basePrice;

        console.log('Chart price:', chartPrice, 'Market price:', marketPrice);

        if (!marketPrice || marketPrice <= 0) {
            console.error('Invalid market price');
            return;
        }

        setIsSubmitting(true);

        try {
            // Parse limit price from input - if user typed a custom price
            const inputLimitPrice = limitPrice && limitPrice.trim() !== '' ? parseFloat(limitPrice) : null;

            // Check if this is a pending limit order (user entered a specific price)
            const isPendingOrder = inputLimitPrice !== null &&
                !isNaN(inputLimitPrice) &&
                inputLimitPrice > 0;

            // For pending orders, use the limit price; for market orders, use current market price
            const executionPrice = isPendingOrder ? inputLimitPrice : marketPrice;

            const trade = {
                symbol: symbol?.symbol || 'EUR/USD',
                type: tradeDirection,
                lotSize: lotSize,
                entryPrice: executionPrice,
                stopLoss: stopLoss ? parseFloat(stopLoss) : null,
                takeProfit: takeProfit ? parseFloat(takeProfit) : null,
                orderType: isPendingOrder ? 'limit' : 'market',
                limitPrice: isPendingOrder ? inputLimitPrice : null,
                timestamp: new Date().toISOString()
            };

            console.log('Trade object created:', trade);

            if (onExecuteTrade) {
                console.log('Calling onExecuteTrade...');
                const result = onExecuteTrade(trade);
                if (result && typeof result.then === 'function') {
                    await result;
                }
                console.log('onExecuteTrade completed');
                setLimitPrice('');
                onClose();
            } else {
                console.error('onExecuteTrade is not defined!');
            }
        } finally {
            setIsSubmitting(false);
            console.log('=== TradingPanel handleTrade END ===');
        }
    };

    const adjustLotSize = (delta) => {
        const decimals = isCrypto ? 4 : 2;
        const minLot = isCrypto ? 0.0001 : 0.01;
        const step = isCrypto ? 0.01 : 0.1;
        const actualDelta = delta > 0 ? step : -step;
        const newSize = Math.max(minLot, Math.min(maxLotSize, lotSize + actualDelta));
        setLotSize(parseFloat(newSize.toFixed(decimals)));
    };

    const formatPrice = (price) => {
        if (!price) return '—';
        if (symbol.symbol.includes('JPY')) return price.toFixed(3);
        if (symbol.symbol.includes('BTC') || symbol.symbol.includes('ETH') || symbol.symbol.includes('SOL')) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (symbol.symbol.includes('XRP') || symbol.symbol.includes('ADA') || symbol.symbol.includes('DOGE')) return price.toFixed(4);
        return price.toFixed(5);
    };

    // Use chart price if available, otherwise fall back to symbol price
    const baseDisplayPrice = chartPrice || symbol.bid || 1.08542;
    const displaySpread = isCrypto ? baseDisplayPrice * 0.001 : 0.00015;
    const currentPrice = tradeDirection === 'buy' ? baseDisplayPrice + displaySpread : baseDisplayPrice;

    // Don't render if modal is closed
    if (!isOpen) return null;

    const overlayClass = positionInChart
        ? 'absolute inset-0 bg-black/50 z-[40] transition-opacity'
        : 'fixed inset-0 bg-black/50 z-[9998] transition-opacity';
    const cardClass = positionInChart
        ? `absolute left-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-r border-slate-800 overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} z-[51]`
        : `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col z-[9999]`;

    const modalContent = (
        <>
            {/* Modal Overlay - click to close */}
            <div
                className={overlayClass}
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Modal Content - above overlay so it stays clickable */}
            <Card
                className={cardClass}
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => e.stopPropagation()}
            >
                    {/* Header with Close Button */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                        <h3 className="text-white font-semibold text-sm">{t('terminal.tradingPanel.newOrder')}</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Scrollable Content */}
                    <div className={positionInChart ? 'overflow-y-auto flex-1 min-h-0' : 'overflow-y-auto flex-1 min-h-0 max-h-[calc(90vh-60px)]'}>
                        <div className="p-4 space-y-4">
                                        {/* Buy/Sell Tabs */}
                            <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setTradeDirection('buy')}
                        className={`py-3 rounded-xl font-semibold transition-all ${tradeDirection === 'buy'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        {t('terminal.tradingPanel.buyLong')}
                    </button>
                    <button
                        onClick={() => setTradeDirection('sell')}
                        className={`py-3 rounded-xl font-semibold transition-all ${tradeDirection === 'sell'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        {t('terminal.tradingPanel.sellShort')}
                    </button>
                </div>

                            {/* Limit Price */}
                            <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm text-slate-300 font-medium">{t('terminal.tradingPanel.price')}</label>
                        <span className="text-xs text-slate-500">{t('terminal.tradingPanel.market')}: {formatPrice(currentPrice)}</span>
                    </div>
                    <Input
                        type="number"
                        step="0.00001"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={t('terminal.tradingPanel.leaveEmpty')}
                        className="bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-500"
                    />
                </div>

                            {/* Lot Size */}
                            <div className="space-y-2">
                    <label className="text-sm text-slate-300 font-medium">{t('terminal.tradingPanel.amount')}</label>
                    <div className="relative">
                        <Input
                            type="number"
                            step={isCrypto ? "0.01" : "0.1"}
                            min={isCrypto ? "0.0001" : "0.01"}
                            value={lotSize}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                    const decimals = isCrypto ? 4 : 2;
                                    setLotSize(parseFloat(val.toFixed(decimals)));
                                }
                            }}
                            className="bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-500 pr-20"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                            {isCrypto ? symbol.symbol.split('/')[0] : t('terminal.lots')}
                        </div>
                    </div>
                </div>

                            {/* Quick Amount Buttons */}
                            <div className="grid grid-cols-5 gap-2">
                    {[10, 25, 50, 75, 100].map((percent) => {
                        const marginForPercent = accountBalance * (percent / 100);
                        const priceForCalc = symbol.bid || 1;
                        const cs = isCrypto ? 1 : 100000;
                        const calculatedLot = (marginForPercent * leverage) / (cs * priceForCalc);

                        return (
                            <button
                                key={percent}
                                onClick={() => {
                                    setLeveragePercent(percent);
                                    const decimals = isCrypto ? 4 : 2;
                                    const minLot = isCrypto ? 0.0001 : 0.01;
                                    const finalLotSize = Math.max(minLot, Math.min(calculatedLot, maxLotSize));
                                    setLotSize(parseFloat(finalLotSize.toFixed(decimals)));
                                }}
                                className={`py-2 text-xs rounded-lg font-medium transition-all ${leveragePercent === percent
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                            >
                                {percent}%
                            </button>
                        );
                    })}
                </div>

                            {/* TP/SL */}
                            <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-sm text-emerald-400 font-medium">{t('terminal.tradingPanel.takeProfit')}</label>
                        <Input
                            type="number"
                            value={takeProfit}
                            onChange={(e) => setTakeProfit(e.target.value)}
                            placeholder={t('terminal.tradingPanel.optional')}
                            className="bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-red-400 font-medium">{t('terminal.tradingPanel.stopLoss')}</label>
                        <Input
                            type="number"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(e.target.value)}
                            placeholder={t('terminal.tradingPanel.optional')}
                            className="bg-slate-800 border-slate-700 text-white font-mono focus:border-red-500"
                        />
                    </div>
                </div>

                            {/* Order Summary */}
                            <div className="bg-slate-800/50 rounded-xl p-4 space-y-2.5 border border-slate-700">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">{t('terminal.tradingPanel.orderValue')}</span>
                        <span className="text-white font-semibold">${calculateOrderValue()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">{t('terminal.tradingPanel.margin')}</span>
                        <span className="text-white font-semibold">${calculateMargin()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">{t('terminal.tradingPanel.leverage')}</span>
                        <span className="text-emerald-400 font-semibold">1:{leverage}</span>
                    </div>
                </div>

                            {/* Execute Button */}
                            <button
                    onClick={handleTrade}
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all active:scale-[0.98] disabled:opacity-50 ${tradeDirection === 'buy'
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30'
                        }`}
                >
                    {tradeDirection === 'buy' ? t('terminal.tradingPanel.placeBuyOrder') : t('terminal.tradingPanel.placeSellOrder')}
                </button>

                            {/* Market Info */}
                            <div className="grid grid-cols-1 gap-3 pt-2">
                    <div className="text-center p-2 bg-slate-800 rounded-lg">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">{t('terminal.tradingPanel.bid')}</p>
                        <p className="text-sm font-mono text-red-400 font-semibold">{formatPrice(symbol.bid)}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">{t('terminal.tradingPanel.spread')}</p>
                        <p className="text-sm font-mono text-slate-300 font-semibold">{symbol.spread}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-800/30 rounded-lg">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">{t('terminal.tradingPanel.ask')}</p>
                        <p className="text-sm font-mono text-emerald-400 font-semibold">{formatPrice(symbol.ask)}</p>
                    </div>
                </div>
                        </div>
                    </div>
            </Card>
        </>
    );

    return createPortal(modalContent, document.body);
}