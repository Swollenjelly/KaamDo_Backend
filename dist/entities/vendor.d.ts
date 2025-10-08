export declare enum VendorType {
    INDIVIDUAL = "individual",
    COMPANY = "company"
}
export declare enum PreferredWorkLocation {
    inside = "inside",
    outside = "outside",
    both = "both"
}
export declare enum gender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other"
}
export declare enum DocumentType {
    AADHAR = "aadhar",
    PAN = "pan",
    DRIVING_LICENSE = "driving_license",
    VOTER_ID = "voter_id",
    PASSPORT = "passport"
}
export declare class Vendor {
    id: number;
    name: string;
    phone: string;
    email: string;
    password: string;
    gender: gender;
    location: number;
    preferredWorkLocation: PreferredWorkLocation;
    vendorType: VendorType;
    documentType: DocumentType;
}
//# sourceMappingURL=vendor.d.ts.map