// src/common/pipes/validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(value: any, metadata: any) {
    // se não houver metatype (primitivos) deixa passar
    const metatype = metadata?.metatype;
    if (!metatype || this.isPrimitive(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
     // evita expor o objeto/valor nos ValidationError retornados
     validationError: { target: false, value: false },
     // outras opções úteis: skipMissingProperties, forbidUnknownValues, etc.
   });

    if (errors.length > 0) {
      const errorMessages = this.flattenErrors(errors).join('; ');
      throw new BadRequestException(errorMessages);
    }

    return value;
  }

  private isPrimitive(metatype: any) {
    const primitives = [String, Boolean, Number, Array, Object];
    return primitives.includes(metatype);
  }

  private flattenErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    for (const err of errors) {
      if (err.constraints) {
        messages.push(...Object.values(err.constraints));
      }
      if (err.children && err.children.length) {
        messages.push(...this.flattenErrors(err.children));
      }
    }

    return messages;
  }
}