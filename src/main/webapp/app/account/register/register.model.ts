import { IInstitution } from '../../entities/institution/institution.model';

export class Registration {
  constructor(
    public login: string,
    public email: string,
    public password: string,
    public langKey: string,
    public institution: number | null,
  ) {}
}
