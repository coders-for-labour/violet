import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

@Injectable()
export class TwibbynService {
    private choices: string[];

    constructor(private http: Http) {}

    public getChoices(): Promise<string[]> {
        if (this.choices)
            return Promise.resolve(this.choices);

        return this.http.get('/twibbon/overlay')
            .toPromise()
            .then(response => response.json() as string[])
            .then(choices => this.choices = choices)
            .catch(this.handleError);
    }

    public save(choice: number): Promise<void> {
        return this.http.post(`/twibbon/save/${choice}`, null)
            .toPromise()
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}