import { Routes } from '@angular/router';
import { MaterialListComponent } from './material/components/material-list/material-list.component';
import { MaterialFormComponent } from './material/components/material-form/material-form.component';
import { MaterialDetailComponent } from './material/components/material-detail/material-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/materials', pathMatch: 'full' },
  { path: 'materials', component: MaterialListComponent },
  { path: 'materials/new', component: MaterialFormComponent },
  { path: 'materials/:id', component: MaterialDetailComponent },
  { path: 'materials/:id/edit', component: MaterialFormComponent },
];
