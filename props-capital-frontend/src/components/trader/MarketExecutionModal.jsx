import React, { useState, useEffect, useRef } from 'react'
import { useTrading } from '@/contexts/TradingContext'
import { createTrade } from '@/api/trades'
import { getCurrentPrice } from '@/api/market-data'
import socket from '@/lib/socket'

const norm = (s) => (s || '').replace(/\//g, '').toUpperCase()

const MarketExecutionModal = ({ isOpen, onClose, orderType: initialOrderType }) => {
    const { selectedSymbol, setOrders, currentSymbolData } = useTrading()

    const [volume, setVolume] = useState('0.01')
    const [stopLoss, setStopLoss] = useState('')
    const [takeProfit, setTakeProfit] = useState('')
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingOrderType, setLoadingOrderType] = useState(null)
    const [error, setError] = useState('')
    const [activeOrderType, setActiveOrderType] = useState(initialOrderType || 'BUY')

    const [realTimeBid, setRealTimeBid] = useState(0)
    const [realTimeAsk, setRealTimeAsk] = useState(0)
    const [bidColor, setBidColor] = useState('text-white')
    const [askColor, setAskColor] = useState('text-white')
    const prevBidRef = useRef(0)
    const prevAskRef = useRef(0)

    const selectedNorm = norm(selectedSymbol)

    const applyPriceUpdate = (bid, ask) => {
        const newBid = parseFloat(bid) || 0
        const newAsk = parseFloat(ask) || 0
        if (newBid > 0) {
            if (newBid > prevBidRef.current && prevBidRef.current > 0) {
                setBidColor('text-green-400')
                setTimeout(() => setBidColor('text-white'), 500)
            } else if (newBid < prevBidRef.current && prevBidRef.current > 0) {
                setBidColor('text-red-400')
                setTimeout(() => setBidColor('text-white'), 500)
            }
            setRealTimeBid(newBid)
            prevBidRef.current = newBid
        }
        if (newAsk > 0) {
            if (newAsk > prevAskRef.current && prevAskRef.current > 0) {
                setAskColor('text-green-400')
                setTimeout(() => setAskColor('text-white'), 500)
            } else if (newAsk < prevAskRef.current && prevAskRef.current > 0) {
                setAskColor('text-red-400')
                setTimeout(() => setAskColor('text-white'), 500)
            }
            setRealTimeAsk(newAsk)
            prevAskRef.current = newAsk
        }
    }

    // 1) Initial from context when modal opens
    useEffect(() => {
        if (!isOpen) return
        const bid = parseFloat(currentSymbolData?.bid) || 0
        const ask = parseFloat(currentSymbolData?.ask) || 0
        if (bid > 0 || ask > 0) {
            setRealTimeBid((v) => (bid > 0 ? bid : v))
            setRealTimeAsk((v) => (ask > 0 ? ask : v))
            if (bid > 0) prevBidRef.current = bid
            if (ask > 0) prevAskRef.current = ask
        }
    }, [isOpen, currentSymbolData?.bid, currentSymbolData?.ask])

    // 2) Socket priceUpdate (when backend sends it) + normalized symbol match
    useEffect(() => {
        if (!isOpen) return
        const handlePriceUpdate = (data) => {
            if (!data?.symbol || norm(data.symbol) !== selectedNorm) return
            applyPriceUpdate(data.bid, data.ask)
        }
        socket.on('priceUpdate', handlePriceUpdate)
        return () => socket.off('priceUpdate', handlePriceUpdate)
    }, [isOpen, selectedNorm])

    // 3) REST polling every 2s so bid/ask update even without socket priceUpdate
    useEffect(() => {
        if (!isOpen || !selectedSymbol) return
        const fetch = () => {
            getCurrentPrice(selectedSymbol).then((res) => {
                if (res?.bid != null || res?.ask != null) applyPriceUpdate(res.bid, res.ask)
            }).catch(() => {})
        }
        fetch()
        const interval = setInterval(fetch, 2000)
        return () => clearInterval(interval)
    }, [isOpen, selectedSymbol])

    useEffect(() => {
        if (isOpen) {
            setVolume('0.01')
            setStopLoss('')
            setTakeProfit('')
            setComment('')
            setError('')
            setActiveOrderType(initialOrderType || 'BUY')
        }
    }, [isOpen, initialOrderType])

    // Get symbol description
    const symbolDescriptions = {
        'EURUSD': 'Euro vs US Dollar',
        'AUDUSD': 'Australian Dollar vs US Dollar',
        'GBPUSD': 'British Pound vs US Dollar',
        'USDJPY': 'US Dollar vs Japanese Yen',
        'XAUUSD': 'Gold vs US Dollar',
        'BTCUSD': 'Bitcoin vs US Dollar',
    }

    const symbolDescription = symbolDescriptions[selectedSymbol] || selectedSymbol

    // Calculate volume in base currency (simplified - assuming 1 lot = 100,000)
    const volumeInBaseCurrency = (parseFloat(volume) || 0) * 100000
    // Use real-time prices (professional trading terminal)
    const currentPrice = parseFloat(activeOrderType === 'BUY' ? realTimeAsk : realTimeBid) || 0
    const bidPriceNum = realTimeBid || 0
    const askPriceNum = realTimeAsk || 0

    const handleVolumeChange = (delta) => {
        const current = parseFloat(volume) || 0.01
        const newVolume = Math.max(0.01, current + delta)
        setVolume(newVolume.toFixed(2))
    }

    const handleStopLossChange = (delta) => {
        const current = parseFloat(stopLoss) || 0
        const currentPrice = parseFloat(activeOrderType === 'BUY' ? realTimeAsk : realTimeBid) || 0

        if (!currentPrice) {
            setError('Current price not available. Please wait...')
            return
        }

        let newSL = current + delta

        // For BUY: SL must be below current price
        // For SELL: SL must be above current price
        if (activeOrderType === 'BUY') {
            newSL = Math.max(0.00001, Math.min(newSL, currentPrice - 0.00001))
        } else {
            newSL = Math.max(currentPrice + 0.00001, newSL)
        }

        setStopLoss(newSL > 0 ? newSL.toFixed(5) : '')
        setError('') // Clear error on valid change
    }

    const handleTakeProfitChange = (delta) => {
        const current = parseFloat(takeProfit) || 0
        const currentPrice = parseFloat(activeOrderType === 'BUY' ? realTimeAsk : realTimeBid) || 0

        if (!currentPrice) {
            setError('Current price not available. Please wait...')
            return
        }

        let newTP = current + delta

        // For BUY: TP must be above current price
        // For SELL: TP must be below current price
        if (activeOrderType === 'BUY') {
            newTP = Math.max(currentPrice + 0.00001, newTP)
        } else {
            newTP = Math.max(0.00001, Math.min(newTP, currentPrice - 0.00001))
        }

        setTakeProfit(newTP > 0 ? newTP.toFixed(5) : '')
        setError('') // Clear error on valid change
    }

    const handleSubmit = async (submitOrderType) => {
        // Clear previous errors
        setError('')

        // Use submitted order type or active order type
        const finalOrderType = submitOrderType || activeOrderType
        // Use real-time prices (professional trading terminal)
        const orderPrice = parseFloat(finalOrderType === 'BUY' ? realTimeAsk : realTimeBid)
        const orderVolume = parseFloat(volume)
        const slValue = stopLoss ? parseFloat(stopLoss) : null
        const tpValue = takeProfit ? parseFloat(takeProfit) : null

        // Validation: Volume
        if (!orderVolume || orderVolume <= 0 || isNaN(orderVolume)) {
            setError('Please enter a valid volume (minimum 0.01)')
            return
        }

        if (orderVolume < 0.01) {
            setError('Volume must be at least 0.01')
            return
        }

        // Validation: Price
        if (!orderPrice || orderPrice <= 0 || isNaN(orderPrice)) {
            setError('Invalid price. Please refresh and try again.')
            return
        }

        // Validation: Stop Loss (if provided)
        if (slValue !== null && slValue !== '') {
            if (isNaN(slValue) || slValue <= 0) {
                setError('Stop Loss must be a valid positive number')
                return
            }

            // SL validation based on order type
            if (finalOrderType === 'BUY' && slValue >= orderPrice) {
                setError('Stop Loss must be below the current price for BUY orders')
                return
            }
            if (finalOrderType === 'SELL' && slValue <= orderPrice) {
                setError('Stop Loss must be above the current price for SELL orders')
                return
            }
        }

        // Validation: Take Profit (if provided)
        if (tpValue !== null && tpValue !== '') {
            if (isNaN(tpValue) || tpValue <= 0) {
                setError('Take Profit must be a valid positive number')
                return
            }

            // TP validation based on order type (PROFESSIONAL TRADING LOGIC)
            // BUY: TP must be ABOVE entry price (we want price to go UP)
            // SELL: TP must be BELOW entry price (we want price to go DOWN)
            if (finalOrderType === 'BUY') {
                if (tpValue <= orderPrice) {
                    setError(`Take Profit must be above the entry price (${orderPrice.toFixed(5)}) for BUY orders`)
                    return
                }
            } else if (finalOrderType === 'SELL') {
                if (tpValue >= orderPrice) {
                    setError(`Take Profit must be below the entry price (${orderPrice.toFixed(5)}) for SELL orders`)
                    return
                }
            }
        }

        // Set active order type for validation
        setActiveOrderType(finalOrderType)
        setLoadingOrderType(finalOrderType)
        setLoading(true)

        // CRITICAL: Capture time IMMEDIATELY when user clicks (real-time)
        const clickTime = new Date()
        const realTimeString = clickTime.toLocaleTimeString()

        // Generate temp ID for error handling
        const tempOrderId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Check if user is logged in
        const token = localStorage.getItem('token')
        if (!token) {
            setError('Please login to place trades')
            setLoading(false)
            setLoadingOrderType(null)
            return
        }

        // Prepare trade data (userId will be extracted from token on backend)
        const tradeData = {
            symbol: selectedSymbol,
            type: finalOrderType,
            volume: orderVolume,
            price: orderPrice,
            takeProfit: tpValue,
            stopLoss: slValue,
            comment: comment.trim() || null
        }

        // OPTIMISTIC UPDATE: Create order immediately with real-time click time
        // This shows the order instantly with exact click time
        const optimisticOrder = {
            ticket: tempOrderId.substring(0, 8),
            symbol: selectedSymbol,
            type: finalOrderType,
            volume: parseFloat(orderVolume),
            price: parseFloat(orderPrice),
            time: realTimeString, // REAL-TIME: Exact click time
            stopLoss: slValue ? parseFloat(slValue) : null,
            takeProfit: tpValue ? parseFloat(tpValue) : null,
            swap: 0,
            profit: 0,
            profitCurrency: 'USD',
            comment: comment.trim() || '',
            id: tempOrderId,
            status: 'OPEN',
            openAt: clickTime.toISOString()
        }

        // Add optimistic order immediately (real-time display)
        if (setOrders) {
            setOrders((prev) => [...prev, optimisticOrder])
        }

        // PROFESSIONAL UX: Hide loading and close modal immediately after optimistic update
        // User sees order instantly, API call happens in background
        setLoading(false)
        setLoadingOrderType(null)
        onClose() // Close modal immediately - order is already visible

        createTrade(tradeData)
            .then((res) => {
                const savedTrade = res?.data?.trade ?? res?.trade
                if (savedTrade) {
                    if (setOrders) {
                        setOrders((prev) => prev.map(order =>
                            order.id === tempOrderId
                                ? {
                                    ...order,
                                    id: savedTrade.id,
                                    ticket: String(savedTrade.id ?? '').substring(0, 8),
                                    time: realTimeString,
                                    openAt: savedTrade.openedAt ?? savedTrade.openAt
                                }
                                : order
                        ))
                    }
                    if (window.notify) {
                        window.notify(`Trade placed successfully: ${savedTrade.symbol} ${savedTrade.type}`, 'success')
                    }
                } else {
                    if (setOrders) setOrders((prev) => prev.filter(order => order.id !== tempOrderId))
                    if (window.notify) window.notify(res?.message || 'Failed to place trade', 'error')
                }
            })
            .catch((err) => {
                if (setOrders) setOrders((prev) => prev.filter(order => order.id !== tempOrderId))
                let errorMsg = 'Failed to place trade'
                if (err?.response) {
                    const d = err.response?.data
                    if (err.response.status === 401) errorMsg = 'Authentication failed. Please login again.'
                    else if (err.response.status === 404) errorMsg = d?.message || 'Symbol not found.'
                    else errorMsg = d?.message || errorMsg
                } else if (err?.request) errorMsg = 'Network error. Please check your connection.'
                if (window.notify) window.notify(errorMsg, 'error')
            })
    }

    // Format volume in base currency (CAD example)
    const volumeDisplay = (parseFloat(volume) || 0) * 100000
    const formattedVolume = volumeDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    if (!isOpen) return null

    return (
        <div className='w-full max-w-sm bg-primary border border-slate-700 rounded-lg shadow-2xl flex flex-col pointer-events-auto' style={{ maxHeight: '95vh', marginTop: '57px' }}>
            {/* Header - Market Execution with dropdown and close */}
            <div className='px-4 py-2.5  border-slate-700 flex items-center justify-between bg-primary '>
                        <div className='flex items-center gap-2'>
                            <h3 className='text-sm font-semibold text-white'>Market Execution</h3>
                            <button className='p-0.5 text-white hover:text-white transition-colors'>
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                                </svg>
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className='p-1 text-white hover:text-white hover:bg-primary rounded transition-colors'
                        >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
            </div>

            {/* Content - Scrollable */}
            <div className='overflow-y-auto p-4 space-y-4' style={{ maxHeight: 'calc(90vh - 60px)' }}>
                {/* Error Message */}
                {error && (
                    <div className='p-2 rounded-lg bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs'>
                        {error}
                    </div>
                )}

                {/* Volume Section */}
                <div>
                    <div className='flex items-center justify-between mb-2'>
                        <label className='text-sm text-white font-medium'>Volume</label>
                        <span className='text-sm text-white'>{formattedVolume} CAD</span>
                    </div>
                    <div className='relative flex items-center'>
                        <button
                            type='button'
                            onClick={() => handleVolumeChange(-0.01)}
                            className='absolute left-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
                        >
                            −
                        </button>
                        <input
                            type='number'
                            value={volume}
                            onChange={(e) => {
                                setVolume(e.target.value)
                                setError('')
                            }}
                            className='w-full px-10 py-2 bg-primary border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-secondary text-center'
                            step='0.01'
                            min='0.01'
                            placeholder='0.01'
                        />
                        <button
                            type='button'
                            onClick={() => handleVolumeChange(0.01)}
                            className='absolute right-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Stop Loss and Take Profit - Side by Side */}
                <div className='grid grid-cols-2 gap-3'>
                    {/* Stop Loss */}
                    <div>
                        <div className='flex items-center justify-between mb-2'>
                            <label className='text-sm text-white font-medium'>Stop Loss</label>
                        </div>
                        <div className='relative flex items-center'>
                            <button
                                type='button'
                                onClick={() => handleStopLossChange(-0.0001)}
                                className='absolute left-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
                                title='Decrease SL'
                            >
                                −
                            </button>
                            <input
                                type='text'
                                value={stopLoss}
                                onChange={(e) => {
                                    const value = e.target.value
                                    // Allow empty, numbers, and decimal point
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                        setStopLoss(value)
                                        setError('')
                                    }
                                }}
                                onBlur={(e) => {
                                    // Format to 5 decimal places when user finishes typing
                                    const numValue = parseFloat(e.target.value)
                                    if (!isNaN(numValue) && numValue > 0) {
                                        setStopLoss(numValue.toFixed(5))
                                    } else if (e.target.value === '') {
                                        setStopLoss('')
                                    }
                                }}
                                placeholder='0.00000'
                                className='w-full px-10 py-2 bg-primary border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-secondary text-center'
                            />
                            <button
                                type='button'
                                onClick={() => handleStopLossChange(0.0001)}
                                className='absolute right-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
                                title='Increase SL'
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Take Profit */}
                    <div>
                        <div className='flex items-center justify-between mb-2'>
                            <label className='text-sm text-white font-medium'>Take Profit</label>
                        </div>
                        <div className='relative flex items-center'>
                            <button
                                type='button'
                                onClick={() => handleTakeProfitChange(-0.0001)}
                                className='absolute left-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
                                title='Decrease TP'
                            >
                                −
                            </button>
                            <input
                                type='text'
                                value={takeProfit}
                                onChange={(e) => {
                                    const value = e.target.value
                                    // Allow empty, numbers, and decimal point
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                        setTakeProfit(value)
                                        setError('')
                                    }
                                }}
                                onBlur={(e) => {
                                    // Format to 5 decimal places when user finishes typing
                                    const numValue = parseFloat(e.target.value)
                                    if (!isNaN(numValue) && numValue > 0) {
                                        setTakeProfit(numValue.toFixed(5))
                                    } else if (e.target.value === '') {
                                        setTakeProfit('')
                                    }
                                }}
                                placeholder='0.00000'
                                className='w-full px-10 py-2 bg-primary border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-secondary text-center'
                            />
                            <button
                                type='button'
                                onClick={() => handleTakeProfitChange(0.0001)}
                                className='absolute right-1 w-8 h-8 flex items-center justify-center bg-primary hover:bg-slate-600 text-white rounded text-sm transition-colors z-10'
                                title='Increase TP'
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comment */}
                <div>
                    <label className='block text-sm text-white font-medium mb-2'>Comment</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder='Optional comment'
                        rows={2}
                        className='w-full px-3 py-2 bg-primary border border-slate-700 rounded text-slate-100 text-sm focus:outline-none focus:border-secondary resize-none'
                    />
                </div>

                {/* Bid/Ask Prices - Real-time with color changes (Professional Trading Terminal) */}
                <div className='flex items-center justify-between py-2 border-t border-slate-700'>
                    <div className='text-sm'>
                        <span className='text-white'>Bid: </span>
                        <span className={`${bidColor} font-medium transition-colors duration-200`}>
                            {bidPriceNum > 0 ? bidPriceNum.toFixed(5) : '---'}
                        </span>
                    </div>
                    <div className='text-sm'>
                        <span className='text-white'>Ask: </span>
                        <span className={`${askColor} font-medium transition-colors duration-200`}>
                            {askPriceNum > 0 ? askPriceNum.toFixed(5) : '---'}
                        </span>
                    </div>
                </div>

                {/* Buy and Sell Buttons - Side by Side */}
                <div className='grid grid-cols-2 gap-3 pt-2'>
                    <button
                        onClick={() => handleSubmit('SELL')}
                        disabled={loading}
                        className='px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {loading && loadingOrderType === 'SELL' ? (
                            <span className='flex items-center justify-center gap-2'>
                                <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
                                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
                                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                </svg>
                                Placing...
                            </span>
                        ) : (
                            'Sell by Market'
                        )}
                    </button>
                    <button
                        onClick={() => handleSubmit('BUY')}
                        disabled={loading}
                        className='px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {loading && loadingOrderType === 'BUY' ? (
                            <span className='flex items-center justify-center gap-2'>
                                <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
                                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
                                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                                </svg>
                                Placing...
                            </span>
                        ) : (
                            'Buy by Market'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

    export default MarketExecutionModal





