import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface PageOptions {
  showFooter: boolean;
}

@Component({
  selector: 'aq-page-layout',
  templateUrl: './page-layout.html',
  styleUrl: './page-layout.scss',
  standalone: true,
  imports: [CommonModule]
})
export class PageLayoutComponent {
  @Input({required: true}) options!: PageOptions;
}
