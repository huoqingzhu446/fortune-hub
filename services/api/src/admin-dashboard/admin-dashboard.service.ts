import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackEntity } from '../database/entities/feedback.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepository: Repository<FeedbackEntity>,
    @InjectRepository(ShareRecordEntity)
    private readonly shareRecordRepository: Repository<ShareRecordEntity>,
  ) {}

  async getDashboard() {
    const [users, orders, feedback, shares, todayUsers, todayOrders, recentUsers] =
      await Promise.all([
        // Totals
        this.userRepository.count(),
        this.orderRepository.count(),
        this.feedbackRepository.count({ where: { status: 'open' } }),
        this.shareRecordRepository.count(),
        // Today
        this.countToday(this.userRepository),
        this.countToday(this.orderRepository),
        // Recent 7 days
        this.countRecentDays(this.userRepository, 7),
      ]);

    const paidOrders = await this.orderRepository.find({
      where: { status: 'paid' },
      select: ['amountFen', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: 500,
    });

    const totalRevenueFen = paidOrders.reduce((sum, o) => sum + o.amountFen, 0);
    const revenueThisMonthFen = paidOrders
      .filter((o) => this.isThisMonth(o.createdAt))
      .reduce((sum, o) => sum + o.amountFen, 0);

    const vipUsers = await this.userRepository.count({
      where: { vipStatus: 'active' },
    });

    // User growth: last 7 days
    const userGrowth = await this.getDailyCounts(this.userRepository, 7);

    // Order trend: last 7 days
    const orderTrend = await this.getDailyCounts(this.orderRepository, 7);

    return {
      code: 0,
      message: 'ok',
      data: {
        totals: {
          users,
          orders,
          openFeedback: feedback,
          shareRecords: shares,
          vipUsers,
        },
        today: {
          newUsers: todayUsers,
          newOrders: todayOrders,
        },
        revenue: {
          totalFen: totalRevenueFen,
          totalYuan: this.fenToYuan(totalRevenueFen),
          thisMonthFen: revenueThisMonthFen,
          thisMonthYuan: this.fenToYuan(revenueThisMonthFen),
          paidOrderCount: paidOrders.length,
        },
        charts: {
          userGrowth,
          orderTrend,
          recentUsers,
        },
        recentOrders: paidOrders.slice(0, 10).map((o) => ({
          orderNo: o.orderNo,
          amountFen: o.amountFen,
          amountYuan: this.fenToYuan(o.amountFen),
          createdAt: o.createdAt.toISOString(),
        })),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async countToday(repo: Repository<{ createdAt: Date }>) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return repo
      .createQueryBuilder('e')
      .where('e.createdAt >= :today', { today: today.toISOString() })
      .getCount();
  }

  private async countRecentDays(
    repo: Repository<{ createdAt: Date }>,
    days: number,
  ) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    return repo
      .createQueryBuilder('e')
      .where('e.createdAt >= :since', { since: since.toISOString() })
      .getCount();
  }

  private async getDailyCounts(
    repo: Repository<{ createdAt: Date }>,
    days: number,
  ) {
    const results: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);

      const count = await repo
        .createQueryBuilder('e')
        .where('e.createdAt >= :start', { start: start.toISOString() })
        .andWhere('e.createdAt <= :end', { end: end.toISOString() })
        .getCount();

      results.push({
        date: `${day.getMonth() + 1}/${day.getDate()}`,
        count,
      });
    }
    return results;
  }

  private isThisMonth(date: Date) {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  private fenToYuan(fen: number) {
    return Math.round(fen) / 100;
  }
}
