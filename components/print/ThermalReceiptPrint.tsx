'use client'

export interface PrintItem {
  quantity: number
  dishName: string
  unitPrice: number
  totalPrice: number
  notes?: string | null
  ingredients?: Array<{
    name: string
    wasAdded: boolean
  }>
}

export interface PrintOrderData {
  orderNumber: number
  tableNumber: string
  createdAt: string
  items: PrintItem[]
  totalAmount: number
  restaurantName?: string
  customerName?: string
}

export function printThermalReceipt(data: PrintOrderData) {
  const win = window.open('', '_blank')
  if (!win) return

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calcula largura máxima para impressora térmica (tipicamente 80mm ≈ 32 caracteres)
  const maxWidth = 40

  const formatLine = (left: string, right: string = '', separator = ' '): string => {
    const totalLen = left.length + right.length
    if (totalLen >= maxWidth) {
      return `${left}\n${right}`
    }
    const spaces = maxWidth - left.length - right.length
    return left + separator.repeat(spaces) + right
  }

  const divider = '='.repeat(maxWidth)
  const separator = '-'.repeat(maxWidth)

  // Montar conteúdo do cupom
  let receiptContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cupom Fiscal - Pedido #${data.orderNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Courier New', monospace;
          background: white;
          color: #000;
          padding: 0;
          line-height: 1.4;
        }

        .receipt {
          width: 80mm;
          padding: 10mm;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 12px;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
        }

        .restaurant-name {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .order-info {
          font-size: 11px;
          margin: 4px 0;
          line-height: 1.3;
        }

        .section {
          margin: 8px 0;
          font-size: 11px;
        }

        .section-title {
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding: 4px 0;
          margin: 8px 0 4px 0;
          font-size: 12px;
        }

        .item {
          margin: 6px 0;
          line-height: 1.3;
        }

        .item-main {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
        }

        .item-qty {
          margin-right: 8px;
        }

        .item-name {
          flex: 1;
          word-break: break-word;
        }

        .item-price {
          text-align: right;
        }

        .ingredient {
          font-size: 9px;
          margin-left: 12px;
          color: #333;
          display: flex;
          align-items: center;
        }

        .ingredient-added::before {
          content: "+ ";
          font-weight: bold;
          color: #22863a;
        }

        .ingredient-removed::before {
          content: "- ";
          font-weight: bold;
          color: #cb2431;
        }

        .notes {
          font-size: 10px;
          font-style: italic;
          margin-left: 12px;
          color: #666;
          margin-top: 2px;
        }

        .divider {
          border-top: 2px solid #000;
          margin: 8px 0;
        }

        .total-section {
          text-align: right;
          margin: 8px 0;
          font-weight: bold;
          font-size: 13px;
        }

        .total-value {
          font-size: 16px;
          margin-top: 4px;
          padding: 4px 0;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .receipt {
            width: 80mm;
            padding: 5mm;
          }
        }

        @page {
          size: 80mm auto;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Header -->
        <div class="header">
          ${data.restaurantName ? `<div class="restaurant-name">${data.restaurantName}</div>` : ''}
          <div class="order-info"><strong>PEDIDO #${String(data.orderNumber).padStart(4, '0')}</strong></div>
          <div class="order-info">Mesa ${data.tableNumber}</div>
          <div class="order-info">${formatTime(data.createdAt)}</div>
          ${data.customerName ? `<div class="order-info">Cliente: ${data.customerName}</div>` : ''}
        </div>

        <!-- Items -->
        <div class="section-title">ITENS DO PEDIDO</div>
        <div class="section">
          ${data.items
            .map(
              (item) => `
            <div class="item">
              <div class="item-main">
                <span class="item-qty">${item.quantity}x</span>
                <span class="item-name">${item.dishName}</span>
                <span class="item-price">R$ ${item.totalPrice.toFixed(2)}</span>
              </div>
              ${
                item.ingredients && item.ingredients.length > 0
                  ? `<div style="margin-top: 2px;">
                      ${item.ingredients
                        .map(
                          (ing) => `
                          <div class="ingredient ${ing.wasAdded ? 'ingredient-added' : 'ingredient-removed'}">
                            ${ing.name}
                          </div>
                        `
                        )
                        .join('')}
                    </div>`
                  : ''
              }
              ${
                item.notes
                  ? `<div class="notes">Obs: ${item.notes}</div>`
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Total -->
        <div class="divider"></div>
        <div class="total-section">
          Subtotal
          <div class="total-value">R$ ${data.totalAmount.toFixed(2)}</div>
        </div>
      </div>

      <script>
        setTimeout(() => {
          window.print()
          setTimeout(() => window.close(), 500)
        }, 100)
      </script>
    </body>
    </html>
  `

  win.document.write(receiptContent)
  win.document.close()
}
