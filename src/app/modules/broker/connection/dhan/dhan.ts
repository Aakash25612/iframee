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
import { DhanBroker } from '../../../../services/brokers/dhan.service';
import { isPlatformServer } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'aq-broker-dhan',
  templateUrl: 'dhan.html',
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
export class DhanComponent implements OnInit {
  constructor(
    private readonly fb: FormBuilder,
    private readonly dhanBroker: DhanBroker
  ) {}

  private readonly platform = inject(PLATFORM_ID);

  protected brokerConfig!: FormGroup;

  ngOnInit(): void {
    this.brokerConfig = this.fb.group({
      clientId: ['', Validators.required],
      accessToken: ['', Validators.required],
    });
  }

  save() {
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
    this.dhanBroker
      .connectBroker(
        localStorage.getItem('userId')!,
        this.brokerConfig.get('clientId')!.value,
        this.brokerConfig.get('accessToken')!.value
      )
      .then((brokerInfo) => {
        console.log(
          'Successfully connected with the Dhan broker: ',
          brokerInfo
        );
      });
  }
}
