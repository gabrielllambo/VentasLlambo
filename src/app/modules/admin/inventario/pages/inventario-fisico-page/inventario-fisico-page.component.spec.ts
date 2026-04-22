import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventarioFisicoPageComponent } from './inventario-fisico-page.component';

describe('InventarioFisicoPageComponent', () => {
  let component: InventarioFisicoPageComponent;
  let fixture: ComponentFixture<InventarioFisicoPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventarioFisicoPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InventarioFisicoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
