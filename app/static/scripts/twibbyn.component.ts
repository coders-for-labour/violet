import { Component, OnInit, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Auth } from './auth.component';
import { TwibbynService } from './twibbyn.service';

@Component({
    selector: 'twibbyn',
    templateUrl: 'views/twibbyn-component.html',
})
@Injectable()
export class TwibbynComponent implements OnInit {
    public auth: Auth;
    public previewImageUrl: string = '';
    public choices: string[];
    public generated: boolean = false;
    public saving: boolean = false;
    public saved: boolean = false;
    private choiceIndex: number = 0;

    constructor(
        private authService: AuthService,
        private twibbynService: TwibbynService) {}

    public ngOnInit(): void {
        this.authService.getAuth().then(auth => {
            this.auth = auth;
            this.init();
        });

        this.twibbynService.getChoices().then(choices => this.choices = choices);
    }

    public nextChoice(): void {
        this.choiceIndex++;

        if (this.choiceIndex >= this.choices.length)
            this.choiceIndex = 0;
    }

    public previousChoice(): void {
        this.choiceIndex--;

        if (this.choiceIndex < 0)
            this.choiceIndex = this.choices.length - 1;
    }

    public getOverlayImageUrl(): string {
        if (!this.choices)
            return '';

        var choice = this.choices[this.choiceIndex];
        return `/images/twibbyn/${choice}`;
    }

    public getGeneratedImageUrl(): string {
        return `/twibbyn/${this.choiceIndex+1}`;
    }

    private init(): void {
        var imageUrl = '/images/twibbyn-preview.jpg';

        if (this.auth)
            imageUrl = this.auth.images.profile.replace('_normal', '');

        this.previewImageUrl = imageUrl;
    }

    public onLogin(): void {
        this.authService.twitter();
    }

    public generate(): void {
        this.generated = true;
    }

    public save(): void {
        this.saving = true;
        this.twibbynService.save(this.choiceIndex + 1).then(() => {
            this.saved = true;
            this.saving = false;
        });
    }

    public cancel(): void {
        this.generated = false;
        this.saved = false;
    }
}
