"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vendor = exports.DocumentType = exports.gender = exports.PreferredWorkLocation = exports.VendorType = void 0;
const typeorm_1 = require("typeorm");
var VendorType;
(function (VendorType) {
    VendorType["INDIVIDUAL"] = "individual";
    VendorType["COMPANY"] = "company";
})(VendorType || (exports.VendorType = VendorType = {}));
var PreferredWorkLocation;
(function (PreferredWorkLocation) {
    PreferredWorkLocation["inside"] = "inside";
    PreferredWorkLocation["outside"] = "outside";
    PreferredWorkLocation["both"] = "both";
})(PreferredWorkLocation || (exports.PreferredWorkLocation = PreferredWorkLocation = {}));
var gender;
(function (gender) {
    gender["MALE"] = "male";
    gender["FEMALE"] = "female";
    gender["OTHER"] = "other";
})(gender || (exports.gender = gender = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["AADHAR"] = "aadhar";
    DocumentType["PAN"] = "pan";
    DocumentType["DRIVING_LICENSE"] = "driving_license";
    DocumentType["VOTER_ID"] = "voter_id";
    DocumentType["PASSPORT"] = "passport";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
let Vendor = class Vendor {
};
exports.Vendor = Vendor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Vendor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Vendor.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", unique: true }),
    __metadata("design:type", String)
], Vendor.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Vendor.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Vendor.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: gender,
    }),
    __metadata("design:type", String)
], Vendor.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Vendor.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: PreferredWorkLocation,
        default: PreferredWorkLocation.both,
    }),
    __metadata("design:type", String)
], Vendor.prototype, "preferredWorkLocation", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: VendorType,
        default: VendorType.INDIVIDUAL,
    }),
    __metadata("design:type", String)
], Vendor.prototype, "vendorType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: DocumentType,
    }),
    __metadata("design:type", String)
], Vendor.prototype, "documentType", void 0);
exports.Vendor = Vendor = __decorate([
    (0, typeorm_1.Entity)("vendors")
], Vendor);
//# sourceMappingURL=vendor.js.map