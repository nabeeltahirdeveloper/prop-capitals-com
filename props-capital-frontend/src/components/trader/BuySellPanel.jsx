import React from 'react'
import { useTranslation } from '@/contexts/LanguageContext'

const BuySellPanel = ({ bidPrice, askPrice, onBuyClick, onSellClick }) => {
    const { t } = useTranslation()

    const handleBuyClick = () => {
        if (onBuyClick) {
            onBuyClick(null) // Pass null as orderData, handler will use it
        }
    }

    const handleSellClick = () => {
        if (onSellClick) {
            onSellClick(null) // Pass null as orderData, handler will use it
        }
    }

    return (
        <div className='flex items-center gap-3'>
            <button
                onClick={handleSellClick}
                className='text-white font-semibold rounded transition-colors text-sm'
            >
                <div className='flex items-center'>
                    <span className='text-xs bg-[#BD3E3E] px-3 py-1.5'>{t('buySellPanel.sell')}</span>
                    <span className='text-xs font-bold bg-[#DE4848] px-3 py-1.5'>{bidPrice || '0.00000'}</span>
                </div>
            </button>
            <button
                onClick={handleBuyClick}
                className='text-white font-semibold rounded transition-colors text-sm'
            >
                <div className='flex items-center'>
                    <span className='text-xs bg-[#2869CE] px-3 py-1.5 cursor-pointer'>{t('buySellPanel.buy')}</span>
                    <span className='text-xs font-bold bg-[#2F7CF2] px-3 py-1.5 cursor-pointer'>{askPrice || '0.00000'}</span>
                </div>
            </button>
        </div>
    )
}

export default BuySellPanel

