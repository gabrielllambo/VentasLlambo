import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormField } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';


@Component({
  selector: 'app-selectAll',
  standalone: false,


  templateUrl: './selectAll.component.html',
  styleUrl: './selectAll.component.css',
  encapsulation: ViewEncapsulation.None
})
export class SelectAllComponent {

  @Input() model: FormControl | any;
  @Input() values: any[];
  @Input() text = 'Seleccionar todos';
  @Input() matSelect: MatSelect;

  isChecked(): boolean {
    return this.model.value && this.values.length
      && this.model.value.length === this.values.length;
  }

  isIndeterminate(): boolean {
    return this.model.value && this.values.length && this.model.value.length
      && this.model.value.length < this.values.length;
  }

  toggleSelection(change: MatCheckboxChange): void {
    if (change.checked) {
      this.model.setValue(this.values);
    } else {
      this.model.setValue([]);
    }
    this.model.markAsTouched();
    this.model.markAsDirty();
    if (this.matSelect) {
      this.matSelect.selectionChange.emit();
    }
  }

}
