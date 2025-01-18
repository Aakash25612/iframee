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
import { IiflSecuritiesBroker } from '../../../../services/brokers/iifl.service';
import { isPlatformServer } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'aq-broker-iifl',
  templateUrl: 'iifl.html',
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
export class IiflSecuritiesComponent implements OnInit {
  constructor(
    private readonly fb: FormBuilder,
    private readonly iiflBroker: IiflSecuritiesBroker
  ) {}

  private readonly platform = inject(PLATFORM_ID);

  protected brokerConfig!: FormGroup;

  ngOnInit(): void {
    this.brokerConfig = this.fb.group({
      clientCode: ['', Validators.required],
      password: ['', Validators.required],
      my2pin: ['', Validators.required],
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
    this.iiflBroker
      .connectBroker(
        localStorage.getItem('userId')!,
        this.brokerConfig.get('clientCode')!.value,
        this.brokerConfig.get('password')!.value,
        this.brokerConfig.get('my2pin')!.value
      )
      .then((brokerInfo) => {
        console.log(
          'Successfully connected with the IIFL Securities broker: ',
          brokerInfo
        );
      });
  }
}
