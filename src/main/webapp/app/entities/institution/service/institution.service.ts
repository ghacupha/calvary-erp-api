import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, asapScheduler, scheduled } from 'rxjs';

import { catchError } from 'rxjs/operators';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { SearchWithPagination } from 'app/core/request/request.model';
import { IInstitution, NewInstitution } from '../institution.model';

export type PartialUpdateInstitution = Partial<IInstitution> & Pick<IInstitution, 'id'>;

export type EntityResponseType = HttpResponse<IInstitution>;
export type EntityArrayResponseType = HttpResponse<IInstitution[]>;

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/institutions');
  protected resourceRegisteredUrl = this.applicationConfigService.getEndpointFor('api/institutions/registered');
  protected resourceSearchUrl = this.applicationConfigService.getEndpointFor('api/institutions/_search');

  create(institution: NewInstitution): Observable<EntityResponseType> {
    return this.http.post<IInstitution>(this.resourceUrl, institution, { observe: 'response' });
  }

  update(institution: IInstitution): Observable<EntityResponseType> {
    return this.http.put<IInstitution>(`${this.resourceUrl}/${this.getInstitutionIdentifier(institution)}`, institution, {
      observe: 'response',
    });
  }

  partialUpdate(institution: PartialUpdateInstitution): Observable<EntityResponseType> {
    return this.http.patch<IInstitution>(`${this.resourceUrl}/${this.getInstitutionIdentifier(institution)}`, institution, {
      observe: 'response',
    });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IInstitution>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IInstitution[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  search(req: SearchWithPagination): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<IInstitution[]>(this.resourceSearchUrl, { params: options, observe: 'response' })
      .pipe(catchError(() => scheduled([new HttpResponse<IInstitution[]>()], asapScheduler)));
  }

  getInstitutionIdentifier(institution: Pick<IInstitution, 'id'>): number {
    return institution.id;
  }

  compareInstitution(o1: Pick<IInstitution, 'id'> | null, o2: Pick<IInstitution, 'id'> | null): boolean {
    return o1 && o2 ? this.getInstitutionIdentifier(o1) === this.getInstitutionIdentifier(o2) : o1 === o2;
  }

  addInstitutionToCollectionIfMissing<Type extends Pick<IInstitution, 'id'>>(
    institutionCollection: Type[],
    ...institutionsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const institutions: Type[] = institutionsToCheck.filter(isPresent);
    if (institutions.length > 0) {
      const institutionCollectionIdentifiers = institutionCollection.map(institutionItem => this.getInstitutionIdentifier(institutionItem));
      const institutionsToAdd = institutions.filter(institutionItem => {
        const institutionIdentifier = this.getInstitutionIdentifier(institutionItem);
        if (institutionCollectionIdentifiers.includes(institutionIdentifier)) {
          return false;
        }
        institutionCollectionIdentifiers.push(institutionIdentifier);
        return true;
      });
      return [...institutionsToAdd, ...institutionCollection];
    }
    return institutionCollection;
  }

  queryRegistered(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IInstitution[]>(this.resourceRegisteredUrl, { params: options, observe: 'response' });
  }
}
