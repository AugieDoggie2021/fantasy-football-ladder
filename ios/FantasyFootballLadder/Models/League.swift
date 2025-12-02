//
//  League.swift
//  FantasyFootballLadder
//
//  League data model
//

import Foundation

struct League: Identifiable {
    let id: String
    let name: String
    let tier: Int?
    
    // Add more properties as needed:
    // let seasonYear: Int?
    // let promotionGroupId: String?
    // let status: String?
}

