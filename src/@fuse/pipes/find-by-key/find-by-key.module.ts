import { NgModule } from '@angular/core';
import { FuseFindByKeyPipe } from './find-by-key.pipe';

@NgModule({
    imports: [FuseFindByKeyPipe],
    exports: [FuseFindByKeyPipe]
})
export class FuseFindByKeyModule {}
