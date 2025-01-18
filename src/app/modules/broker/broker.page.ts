import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { PageOptions, PageLayoutComponent } from '../../components/page-layout';
import { ActivatedRoute } from '@angular/router';
import { BrokerService } from '../../services/broker.service';
import { BrokerConnectionComponent } from './connection/connection';
import { TokenService } from '../../services/token.service';
import { BrokerContext } from '../../models/contexts/BrokerContext';
import { UserService } from '../../services/user.service';
import { isPlatformServer } from '@angular/common';
import { Tenant } from '../../models/enums/Tenants';
import { BrokerStore } from '../../stores/broker.store';
import { BrokerDashboardComponent } from './dashboard/dashboard';

@Component({
  templateUrl: 'broker.page.html',
  styleUrl: 'broker.page.scss',
  standalone: true,
  imports: [
    BrokerConnectionComponent,
    BrokerDashboardComponent,
    PageLayoutComponent,
  ],
})
export class BrokerPage implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly tokenService: TokenService<BrokerContext>,
    private readonly userService: UserService,
    private readonly brokerService: BrokerService,
    private readonly brokerStore: BrokerStore
  ) {}

  private readonly platform = inject(PLATFORM_ID);

  protected readonly pageOptions: PageOptions = {
    showFooter: true,
  };

  async ngOnInit(): Promise<void> {
    if (isPlatformServer(this.platform)) {
      return;
    }

    this.pageOptions.showFooter =
      this.route.snapshot.queryParamMap.get('hideFooter') !== 'true';

    if (this.route.snapshot.queryParamMap.has('token')) {
      this.processToken();
      return;
    }

    const userEmail = localStorage.getItem('userEmail');
    const tenant = localStorage.getItem('tenant') as Tenant;

    if (userEmail !== null && tenant !== null) {
      const [funds, netHoldings] = await Promise.all([
        this.brokerService.getFunds(userEmail!, tenant!),
        this.brokerService.getNetHoldings(userEmail!, tenant!),
      ]);

      if (funds && netHoldings) {
        this.brokerStore.initialize(funds, netHoldings);
        // load the broker dashboard component
        return;
      }
    }

    // throw some error, or redirect to an error page.
    throw new Error('Token is required for loading this page.');
  }

  protected isBrokerConnected() {
    return this.brokerStore.isConnected();
  }

  private processToken() {
    const token = this.route.snapshot.queryParamMap.get('token')!;
    this.tokenService.getContext(token).then((context) => {
      // Creates user if it doesn't exist for the tenant; or fetches existing user.
      this.userService
        .createMinimalUser(context.userEmail, context.tenant)
        .then((user) => {
          localStorage.setItem('userId', user._id);
        });

      localStorage.setItem('userEmail', context.userEmail);
      localStorage.setItem('tenant', context.tenant);
    });

    // TODO(agrawalhardik93): Handle the token verification failure scenario.
  }
}
