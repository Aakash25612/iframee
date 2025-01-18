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
import { AliceBlueBroker } from '../../../../services/brokers/aliceblue.service';
import { isPlatformServer } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'aq-broker-aliceblue',
  templateUrl: 'aliceblue.html',
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
export class AliceBlueComponent implements OnInit {
  constructor(
    private readonly fb: FormBuilder,
    private readonly aliceBlueBroker: AliceBlueBroker
  ) {}

  private readonly platform = inject(PLATFORM_ID);

  protected brokerConfig!: FormGroup;

  ngOnInit(): void {
    this.brokerConfig = this.fb.group({
      userId: ['', Validators.required],
      apiKey: ['', Validators.required],
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
    this.aliceBlueBroker
      .connectBroker(
        localStorage.getItem('userId')!,
        this.brokerConfig.get('userId')!.value,
        this.brokerConfig.get('apiKey')!.value
      )
      .then((brokerInfo) => {
        console.log(
          'Successfully connected with the AliceBlue broker: ',
          brokerInfo
        );
      });
  }
}
