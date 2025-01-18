import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SplitButtonModule } from 'primeng/splitbutton';
import { environment } from '../../../../../environments/environment';
import { HdfcBroker } from '../../../../services/brokers/hdfc.service';
import { isPlatformServer } from '@angular/common';

@Component({
  selector: 'aq-broker-hdfc',
  templateUrl: 'hdfc.html',
  standalone: true,
  imports: [
    ButtonModule,
    InputGroupAddonModule,
    InputGroupModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    SplitButtonModule,
  ],
})
export class HdfcSecuritiesComponent implements OnInit {
  constructor(
    private readonly fb: FormBuilder,
    private readonly hdfcBroker: HdfcBroker
  ) {}

  private readonly platform = inject(PLATFORM_ID);

  protected readonly brokerConnectRedirectUrl =
    environment.brokerConnectRedirectUrl;

  protected brokerConfig!: FormGroup;

  ngOnInit(): void {
    this.brokerConfig = this.fb.group({
      apiKey: ['', Validators.required],
      apiSecret: ['', Validators.required],
    });
  }

  save(): void {
    if (isPlatformServer(this.platform)) {
      return;
    }

    const userId = localStorage.getItem('userId');
    if (userId === null) {
      // throw some error here, or redirect accordingly.
    }

    if (this.brokerConfig.invalid) {
      // TODO(agrawalhardik93): Throw some error / toast message. Ideally
      //   this will never happen, as the button would be disabled.
      return;
    }

    // TODO(agrawalhardik93): Throw some error / toast message on failure.
    const apiKey = this.brokerConfig.get('apiKey')!.value;
    const apiSecret = this.brokerConfig.get('apiSecret')!.value;
    Promise.all([
      this.hdfcBroker.getLoginUrl(apiKey),
      this.hdfcBroker.updateBrokerDetails(
        localStorage.getItem('userId')!,
        apiKey,
        apiSecret
      ),
    ]).then((values) => {
      const loginUrl = values[0];
      window.location.href = loginUrl;
    });
  }
}
