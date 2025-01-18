import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

import { CardModule } from 'primeng/card';
import { Funds, NetHoldings } from '../../../models/BrokerInfo';
import { BrokerStore } from '../../../stores/broker.store';

@Component({
  selector: 'aq-broker-dashboard',
  templateUrl: 'dashboard.html',
  styleUrl: 'dashboard.scss',
  standalone: true,
  imports: [CardModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrokerDashboardComponent implements OnInit {
  constructor(private readonly brokerStore: BrokerStore) {}

  protected funds?: Funds;
  protected netHoldings?: NetHoldings;

  ngOnInit(): void {
    this.funds = this.brokerStore.getFunds();
    this.netHoldings = this.brokerStore.getNetHoldings();
  }
}
