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
import { SelectButtonModule } from 'primeng/selectbutton';
import { SplitButtonModule } from 'primeng/splitbutton';
import { KotakBroker } from '../../../../services/brokers/kotak.service';
import { isPlatformServer } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'aq-broker-kotak',
  templateUrl: 'kotak.html',
  standalone: true,
  imports: [
    ButtonModule,
    InputGroupAddonModule,
    InputGroupModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    SelectButtonModule,
    SplitButtonModule,
  ],
})
export class KotakComponent implements OnInit {
  constructor(
    private readonly fb: FormBuilder,
    private readonly kotakBroker: KotakBroker
  ) {}

  private readonly platform = inject(PLATFORM_ID);

  protected brokerConfig!: FormGroup;

  ngOnInit(): void {
    this.brokerConfig = this.fb.group({
      loginMode: ['mobile', Validators.required],
      consumerKey: ['', Validators.required],
      consumerSecret: ['', Validators.required],
      mobile: [''],
      pan: [''],
      password: ['', Validators.required],
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
    // const apiKey = this.brokerConfig.get('apiKey')!.value;
    // const secretKey = this.brokerConfig.get('secretKey')!.value;
    // Promise.all([
    //   this.iciciBroker.getLoginUrl(apiKey),
    //   this.iciciBroker.updateBrokerDetails(
    //     localStorage.getItem('userId')!,
    //     apiKey,
    //     secretKey
    //   ),
    // ]).then((values) => {
    //   const loginUrl = values[0];
    //   window.location.href = loginUrl;
    // });
  }

  protected getLoginMode(): 'mobile' | 'pan' {
    return this.brokerConfig.get('loginMode')!.value;
  }
}
