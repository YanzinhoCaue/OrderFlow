'use client'

import { useState } from 'react'
import { FiCreditCard, FiDollarSign } from 'react-icons/fi'
import { FaMoneyBillWave, FaPix } from 'react-icons/fa6'

export type PaymentMethod = {
  id: string
  name: string
  enabled: boolean
}

export type PaymentSettings = {
  methods: PaymentMethod[]
  serviceFee?: number
  serviceFeetype?: 'percentage' | 'fixed'
  acceptsCash?: boolean
  pixKey?: string
}

interface PaymentMethodsProps {
  settings: PaymentSettings
  onChange: (settings: PaymentSettings) => void
}

const DEFAULT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Dinheiro', enabled: true },
  { id: 'credit', name: 'Cartão de crédito', enabled: true },
  { id: 'debit', name: 'Cartão de débito', enabled: true },
  { id: 'pix', name: 'PIX', enabled: true },
  { id: 'meal_voucher', name: 'Vale-refeição', enabled: false },
  { id: 'food_voucher', name: 'Vale-alimentação', enabled: false },
]

const METHOD_ICONS: Record<string, any> = {
  cash: FaMoneyBillWave,
  credit: FiCreditCard,
  debit: FiCreditCard,
  pix: FaPix,
  meal_voucher: FiDollarSign,
  food_voucher: FiDollarSign,
}

export default function PaymentMethods({ settings, onChange }: PaymentMethodsProps) {
  const methods = settings.methods.length > 0 ? settings.methods : DEFAULT_METHODS

  const toggleMethod = (id: string) => {
    const updatedMethods = methods.map((m) =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    )
    onChange({ ...settings, methods: updatedMethods })
  }

  const updateServiceFee = (value: string) => {
    const fee = parseFloat(value) || 0
    onChange({ ...settings, serviceFee: fee })
  }

  const updateServiceFeeType = (type: 'percentage' | 'fixed') => {
    onChange({ ...settings, serviceFeetype: type })
  }

  return (
    <div className="space-y-6">
      {/* Formas de pagamento */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
          Formas de pagamento aceitas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {methods.map((method) => {
            const Icon = METHOD_ICONS[method.id] || FiDollarSign
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => toggleMethod(method.id)}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  method.enabled
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      method.enabled
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-stone-100 dark:bg-stone-800'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        method.enabled
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-stone-500 dark:text-stone-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <span
                      className={`font-medium ${
                        method.enabled
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {method.name}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      method.enabled
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}
                  >
                    {method.enabled && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Taxa de serviço */}
      <div className="p-4 bg-stone-50 dark:bg-white/5 rounded-lg border border-stone-200 dark:border-stone-700">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">
          Taxa de serviço
        </h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateServiceFeeType('percentage')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition ${
                settings.serviceFeetype === 'percentage'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                  : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-white/10 text-stone-600 dark:text-stone-400'
              }`}
            >
              Percentual (%)
            </button>
            <button
              type="button"
              onClick={() => updateServiceFeeType('fixed')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition ${
                settings.serviceFeetype === 'fixed'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                  : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-white/10 text-stone-600 dark:text-stone-400'
              }`}
            >
              Valor fixo (R$)
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-3 text-stone-500 dark:text-stone-400">
              {settings.serviceFeetype === 'percentage' ? '%' : 'R$'}
            </span>
            <input
              type="number"
              step={settings.serviceFeetype === 'percentage' ? '0.1' : '0.01'}
              min="0"
              placeholder={settings.serviceFeetype === 'percentage' ? '10' : '5.00'}
              value={settings.serviceFee || ''}
              onChange={(e) => updateServiceFee(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white placeholder-stone-400"
            />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {settings.serviceFeetype === 'percentage'
              ? 'Percentual aplicado sobre o valor total do pedido'
              : 'Valor fixo adicionado a cada pedido'}
          </p>
        </div>
      </div>

      {/* Chave PIX */}
      <div className="p-4 bg-stone-50 dark:bg-white/5 rounded-lg border border-stone-200 dark:border-stone-700">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4 flex items-center gap-2">
          <FaPix className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Chave PIX para cobranças
        </h3>
        <div className="space-y-2">
          <label className="text-xs text-stone-600 dark:text-stone-400">
            Cole sua chave PIX (CPF, CNPJ, e-mail ou telefone)
          </label>
          <input
            type="text"
            placeholder="Seu CPF, CNPJ, e-mail ou telefone cadastrado no PIX"
            value={settings.pixKey || ''}
            onChange={(e) => onChange({ ...settings, pixKey: e.target.value })}
            className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white placeholder-stone-400"
          />
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Esta chave será exibida para os clientes quando escolherem PIX como forma de pagamento
          </p>
        </div>
      </div>
    </div>
  )
}
