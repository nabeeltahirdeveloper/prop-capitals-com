import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrderStatus, OrderType, TradeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type RuntimePendingOrder = {
    id: string;
    tradingAccountId: string;
    symbol: string;
    type: TradeType;
    orderType: OrderType;
    volume: number;
    price: number;
    limitPrice?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    status: OrderStatus;
};

type SymbolBook = {
    buyLimit: Map<number, Set<string>>;
    sellLimit: Map<number, Set<string>>;
    buyStop: Map<number, Set<string>>;
    sellStop: Map<number, Set<string>>;
    buyStopLimit: Map<number, Set<string>>;
    sellStopLimit: Map<number, Set<string>>;
};

@Injectable()
export class PendingOrderRegistryService implements OnModuleInit {
    private readonly logger = new Logger(PendingOrderRegistryService.name);

    private readonly ordersById = new Map<string, RuntimePendingOrder>();
    private readonly booksBySymbol = new Map<string, SymbolBook>();

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        await this.bootstrapFromDatabase();
    }

    private ensureSymbolBook(symbol: string): SymbolBook {
        let book = this.booksBySymbol.get(symbol);

        if (!book) {
            book = {
                buyLimit: new Map(),
                sellLimit: new Map(),
                buyStop: new Map(),
                sellStop: new Map(),
                buyStopLimit: new Map(),
                sellStopLimit: new Map(),
            };

            this.booksBySymbol.set(symbol, book);
        }

        return book;
    }

    private getBucket(
        order: RuntimePendingOrder,
        book: SymbolBook,
    ): Map<number, Set<string>> {
        if (order.type === 'BUY' && order.orderType === 'LIMIT') return book.buyLimit;
        if (order.type === 'SELL' && order.orderType === 'LIMIT') return book.sellLimit;
        if (order.type === 'BUY' && order.orderType === 'STOP') return book.buyStop;
        if (order.type === 'SELL' && order.orderType === 'STOP') return book.sellStop;
        if (order.type === 'BUY' && order.orderType === 'STOP_LIMIT') return book.buyStopLimit;
        if (order.type === 'SELL' && order.orderType === 'STOP_LIMIT') return book.sellStopLimit;

        throw new Error(`Unsupported order combination: ${order.type} ${order.orderType}`);
    }

    async bootstrapFromDatabase(): Promise<void> {
        this.ordersById.clear();
        this.booksBySymbol.clear();

        const pendingOrders = await this.prisma.pendingOrder.findMany({
            where: {
                status: 'PENDING',
            },
        });

        for (const order of pendingOrders) {
            this.registerOrder({
                id: order.id,
                tradingAccountId: order.tradingAccountId,
                symbol: order.symbol,
                type: order.type,
                orderType: order.orderType,
                volume: order.volume,
                price: order.price,
                limitPrice: (order as any).limitPrice ?? null,
                stopLoss: order.stopLoss,
                takeProfit: order.takeProfit,
                status: order.status,
            });
        }

        this.logger.log(
            `Pending order registry bootstrapped with ${this.ordersById.size} orders across ${this.booksBySymbol.size} symbols`,
        );
    }

    registerOrder(order: RuntimePendingOrder): void {
        if (order.status !== 'PENDING') return;

        const book = this.ensureSymbolBook(order.symbol);
        const bucket = this.getBucket(order, book);

        this.ordersById.set(order.id, order);

        if (!bucket.has(order.price)) {
            bucket.set(order.price, new Set());
        }

        bucket.get(order.price)!.add(order.id);

        this.logger.debug(`Registered pending order ${order.id} in memory`);
    }

    removeOrder(orderId: string): void {
        const order = this.ordersById.get(orderId);
        if (!order) return;

        const book = this.booksBySymbol.get(order.symbol);
        if (!book) {
            this.ordersById.delete(orderId);
            return;
        }

        const bucket = this.getBucket(order, book);
        const idsAtPrice = bucket.get(order.price);

        if (idsAtPrice) {
            idsAtPrice.delete(orderId);

            if (idsAtPrice.size === 0) {
                bucket.delete(order.price);
            }
        }

        this.ordersById.delete(orderId);

        this.logger.debug(`Removed pending order ${orderId} from memory`);
    }

    findTriggeredOrders(symbol: string, bid: number, ask: number): string[] {
        const book = this.booksBySymbol.get(symbol);
        if (!book) return [];

        const triggered = new Set<string>();

        for (const [price, ids] of book.buyLimit.entries()) {
            if (ask <= price) {
                for (const id of ids) {
                    triggered.add(id);
                }
            }
        }

        for (const [price, ids] of book.sellLimit.entries()) {
            if (bid >= price) {
                for (const id of ids) {
                    triggered.add(id);
                }
            }
        }

        for (const [price, ids] of book.buyStop.entries()) {
            if (ask >= price) {
                for (const id of ids) {
                    triggered.add(id);
                }
            }
        }

        for (const [price, ids] of book.sellStop.entries()) {
            if (bid <= price) {
                for (const id of ids) {
                    triggered.add(id);
                }
            }
        }

        // BUY STOP_LIMIT: triggers when ask >= trigger price
        for (const [price, ids] of book.buyStopLimit.entries()) {
            if (ask >= price) {
                for (const id of ids) {
                    triggered.add(id);
                }
            }
        }

        // SELL STOP_LIMIT: triggers when bid <= trigger price
        for (const [price, ids] of book.sellStopLimit.entries()) {
            if (bid <= price) {
                for (const id of ids) {
                    triggered.add(id);
                }
            }
        }

        return [...triggered];
    }





    getOrderById(orderId: string) {
        return this.ordersById.get(orderId);
    }

    getStats() {
        return {
            totalOrdersInMemory: this.ordersById.size,
            totalSymbolsTracked: this.booksBySymbol.size,
        };
    }
}