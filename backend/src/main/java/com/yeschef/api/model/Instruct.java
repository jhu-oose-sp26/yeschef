package com.yeschef.api.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;


@Entity
@Table(name ="instruction")
public class Instruct {

    @Id // this is the primary ID
    @GeneratedValue(strategy = GenerationType.IDENTITY) // will auto-generate ID
    private Long id;

    @Column(nullable = false) 
    private int prepTime;

    @Column(nullable = false) 
    private int cookTime;

    @OneToOne
    @JoinColumn(name = "recipe_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Recipe recipe;

    @Embeddable
    public static class InstructionStep {
        @Column(name="step_number", nullable=false)
        private Integer stepNumber;

        @Column(name="step_description", nullable=false)
        private String stepDescription;

        public InstructionStep() {}

        public InstructionStep(Integer stepNumber, String stepDescription) {
            this.stepNumber = stepNumber;
            this.stepDescription = stepDescription;
        }

        public Integer getStepNumber() { return stepNumber; }
        public String getStepDescription() { return stepDescription; }
        public void setStepNumber(Integer stepNumber) { this.stepNumber = stepNumber; }
        public void setStepDescription(String stepDescription) { this.stepDescription = stepDescription; }
    }

    @ElementCollection // tells JPA that this is collection of basic values
    // creates a separate table called "instruction_steps" to store the map entries
    @CollectionTable(
        name = "instruction_steps", 
        joinColumns = @JoinColumn(name = "instruction_id", nullable=false),
        uniqueConstraints = @UniqueConstraint(columnNames={"instruction_id","step_number"})
    ) 
    private List<InstructionStep> steps;
}