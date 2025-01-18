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
import { FyersBroker } from '../../../../services/brokers/fyers.service';
import { isPlatformServer } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'aq-broker-fyers',
  templateUrl: 'fyers.html',
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
export class FyersComponent implements OnInit {
  constructor(
    private readonly fb: FormBuilder,
    private readonly fyersBroker: FyersBroker
  ) {}

  private readonly platform = inject(PLATFORM_ID);

  protected brokerConfig!: FormGroup;

  ngOnInit(): void {
    this.brokerConfig = this.fb.group({
      appId: ['', Validators.required],
      secretId: ['', Validators.required],
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
    const appId = this.brokerConfig.get('appId')!.value;
    const secretId = this.brokerConfig.get('secretId')!.value;
    Promise.all([
      this.fyersBroker.getLoginUrl(appId, secretId),
      this.fyersBroker.updateBrokerDetails(
        localStorage.getItem('userId')!,
        appId,
        secretId
      ),
    ]).then((values) => {
      const loginUrl = values[0];
      window.location.href = loginUrl;
    });
  }
}
