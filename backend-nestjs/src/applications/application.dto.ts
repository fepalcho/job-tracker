import { IsDateString, IsIn, IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';
import { STATUSES, type Status } from './application.schema.js';

export class ApplicationDto {
  @IsString()
  @Length(2, 100)
  company: string;

  @IsString()
  @Length(2, 100)
  position: string;

  @IsOptional()
  @IsUrl()
  offerUrl?: string | null;

  @IsOptional()
  @IsIn([...STATUSES])
  status?: Status;

  @IsOptional()
  @IsDateString()
  appliedAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}