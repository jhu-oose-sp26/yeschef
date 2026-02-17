package com.yeschef.api.model;

import java.util.HashMap;
import java.util.Map;

import jakarta.persistence.*;


@Entity
@Table(name ="INSTRUCTION")
public class Instruct {

    @Id // this is the primary ID
    @GeneratedValue(strategy = GenerationType.IDENTITY) // will auto-generate ID
    private Long id;

    @Column(nullable = false) 
    private int prepTime;

    @Column(nullable = false) 
    private int cookTime;

    @ElementCollection // tells JPA that this is collection of basic values
    // creates a separate table called "instruction_steps" to store the map entries
    @CollectionTable(name = "instruction_steps", joinColumns = @JoinColumn(name = "instruction_id")) 
    // this table has three columns: instruction_id, step_number, and step_description
    @MapKeyColumn(name = "step_number")
    @Column(name = "step_description")
    private Map<Integer, String> steps = new HashMap<>();
}

